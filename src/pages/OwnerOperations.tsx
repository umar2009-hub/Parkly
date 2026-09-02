import React, { useState, useEffect, useRef } from 'react';
import { dbService, triggerRealtimeEvent } from '../services/dbAdapter';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ParkingLocation, ParkingSlot, Booking, AccessLog } from '../types';
import { 
  Activity, Play, Square, RefreshCcw, ShieldAlert, Cpu, 
  Scan, Camera, CheckCircle, XCircle, ArrowRightLeft, Radio, Check
} from 'lucide-react';

export const OwnerOperations: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocId, setSelectedLocId] = useState('');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Access Control states
  const [activeTab, setActiveTab] = useState<'ANPR' | 'QR' | 'RFID'>('ANPR');
  const [cameraActive, setCameraActive] = useState(false);
  const [rfidInput, setRfidInput] = useState('');
  const [manualPlate, setManualPlate] = useState('');

  // Gate simulation states
  const [gateState, setGateState] = useState<'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING'>('CLOSED');
  const [validationResult, setValidationResult] = useState<{
    status: 'IDLE' | 'SUCCESS' | 'ERROR';
    message: string;
    details?: any;
  }>({ status: 'IDLE', message: '' });

  // Camera & Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // CDN script loaders state
  const [jsqrLoaded, setJsqrLoaded] = useState(false);
  const [tesseractLoaded, setTesseractLoaded] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // Load resources
  useEffect(() => {
    // Load jsQR dynamically
    if (!window.hasOwnProperty('jsQR')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      script.onload = () => setJsqrLoaded(true);
      document.body.appendChild(script);
    } else {
      setJsqrLoaded(true);
    }

    // Load Tesseract.js dynamically
    if (!(window as any).Tesseract) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.3/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => setTesseractLoaded(true);
      document.body.appendChild(script);
    } else {
      setTesseractLoaded(true);
    }

    loadInitialData();

    return () => {
      stopCamera();
    };
  }, [user]);

  // Listen for real-time checkout payment completions
  useEffect(() => {
    const handlePaymentComplete = (e: any) => {
      const completedBooking = e.detail;
      
      // If the currently validating (waiting) booking matches the one that just got paid
      if (
        validationResult.status === 'WARNING' && 
        validationResult.details?.id === completedBooking.id &&
        completedBooking.status === 'COMPLETED'
      ) {
        setValidationResult({
          status: 'SUCCESS',
          message: `✓ EXIT GRANTED: Payment of ₹${completedBooking.final_amount} successful for vehicle ${completedBooking.vehicle?.registration_number}. Thank you.`,
          details: completedBooking
        });
        triggerGateOpen();
      }
    };
    
    window.addEventListener('checkout_payment_completed', handlePaymentComplete);
    return () => window.removeEventListener('checkout_payment_completed', handlePaymentComplete);
  }, [validationResult]);

  const loadInitialData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const locs = await dbService.getParkingLocations('OWNER', user.id);
      const approved = locs.filter(l => l.status === 'APPROVED');
      setLocations(approved);
      if (approved.length > 0) {
        setSelectedLocId(approved[0].id);
      }
    } catch (err: any) {
      showToast('Error loading properties.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveStatus = async () => {
    if (!selectedLocId) return;
    try {
      const allSlots = await dbService.getParkingSlots(selectedLocId);
      setSlots(allSlots);

      const allBookings = await dbService.getBookings('OWNER', user!.id);
      // Filter active or confirmed bookings for this specific location
      const locBookings = allBookings.filter(b => b.slot?.location_id === selectedLocId);
      setBookings(locBookings);

      const logs = await dbService.getAccessLogs(selectedLocId);
      setAccessLogs(logs.slice(0, 10)); // recent 10 logs
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedLocId) {
      loadLiveStatus();
      
      const handleUpdate = () => loadLiveStatus();
      window.addEventListener('booking_created', handleUpdate);
      window.addEventListener('booking_updated', handleUpdate);
      window.addEventListener('slot_status_changed', handleUpdate);
      
      return () => {
        window.removeEventListener('booking_created', handleUpdate);
        window.removeEventListener('booking_updated', handleUpdate);
        window.removeEventListener('slot_status_changed', handleUpdate);
      };
    }
  }, [selectedLocId]);

  // Start Video Camera Stream
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setValidationResult({ status: 'IDLE', message: '' });
      const constraints = { video: { facingMode: 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start processing loop based on active tab
      if (activeTab === 'QR') {
        scanIntervalRef.current = setInterval(processQRFrame, 500);
      }
    } catch (err: any) {
      showToast('Webcam access was denied or is unavailable.', 'warning');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    setOcrProcessing(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Change camera loop on tab switch
  useEffect(() => {
    if (cameraActive) {
      stopCamera();
      setTimeout(startCamera, 200);
    }
  }, [activeTab]);

  // Process canvas frame for QR scanning
  const processQRFrame = () => {
    if (!videoRef.current || !canvasRef.current || !jsqrLoaded) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        // QR detected!
        stopCamera();
        validateAccessCredential('QR', code.data);
      }
    }
  };

  // Capture Frame for ANPR (OCR)
  const captureANPRFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !tesseractLoaded) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      setOcrProcessing(true);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Perform OCR
      const Tesseract = (window as any).Tesseract;
      const result = await Tesseract.recognize(canvas, 'eng');
      const text = result.data.text || '';
      
      // Clean and extract plate numbers (alphanumeric strings, matching Indian styles or standard formats)
      const cleanPlate = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      if (cleanPlate.length >= 4) {
        showToast(`OCR Detected Plate: ${cleanPlate}`, 'info');
        validateAccessCredential('ANPR', cleanPlate);
      } else {
        showToast('Low confidence recognition. Try again or position closer.', 'warning');
      }
    } catch (err: any) {
      showToast('OCR engine failure.', 'error');
    } finally {
      setOcrProcessing(false);
    }
  };

  // Central Access Verification Logic
  const validateAccessCredential = async (method: 'ANPR' | 'QR' | 'RFID' | 'MANUAL', token: string) => {
    if (!selectedLocId) return;
    
    // Normalize plate numbers if method is ANPR or MANUAL
    let lookupToken = token.trim();
    if (method === 'ANPR' || method === 'MANUAL') {
      lookupToken = token.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    try {
      setValidationResult({ status: 'IDLE', message: `Verifying ${method} credential: ${lookupToken}...` });
      
      // 1. Find all active or confirmed bookings for this location
      const allBookings = await dbService.getBookings('OWNER', user!.id);
      const locBookings = allBookings.filter(b => b.slot?.location_id === selectedLocId);

      // 2. Perform Lookup
      let matchedBooking: Booking | undefined;

      if (method === 'QR') {
        matchedBooking = locBookings.find(b => b.qr_code_token === lookupToken || b.exit_qr_token === lookupToken);
      } else if (method === 'ANPR' || method === 'MANUAL') {
        matchedBooking = locBookings.find(b => b.vehicle?.registration_number.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === lookupToken);
      } else if (method === 'RFID') {
        // Look up registered RFID tags
        // Fallback or database lookup
        const rfids = await dbService.getRfidCredentials(user!.id);
        const cred = rfids.find(r => r.rfid_uid.trim().toUpperCase() === lookupToken.toUpperCase());
        if (cred) {
          matchedBooking = locBookings.find(b => b.vehicle_id === cred.vehicle_id);
        }
      }

      if (!matchedBooking) {
        // ACCESS DENIED
        setValidationResult({ 
          status: 'ERROR', 
          message: `ACCESS DENIED: No valid, active booking exists at this location matching credential "${lookupToken}".`
        });
        
        await dbService.addAccessLog({
          location_id: selectedLocId,
          method: method === 'MANUAL' ? 'MANUAL' : method,
          event_type: 'ENTRY',
          result: 'DENIED',
          plate_number: (method === 'ANPR' || method === 'MANUAL') ? lookupToken : undefined,
          rfid_uid: method === 'RFID' ? lookupToken : undefined,
          reason: 'No active booking matches this credential'
        });
        
        loadLiveStatus();
        return;
      }

      // Check time validity
      const now = Date.now();
      const start = new Date(matchedBooking.start_time).getTime();
      const end = new Date(matchedBooking.end_time).getTime();

      // Determine Check-In or Check-Out event type
      const isCheckingIn = ['CONFIRMED', 'PENDING_ENTRY'].includes(matchedBooking.status);
      const isCheckingOut = matchedBooking.status === 'ACTIVE';

      if (method === 'QR') {
        if (isCheckingIn && lookupToken !== matchedBooking.qr_code_token) {
          setValidationResult({ status: 'ERROR', message: `ACCESS DENIED: Please scan the ENTRY QR pass.` });
          return;
        }
        if (isCheckingOut && lookupToken !== matchedBooking.exit_qr_token) {
          setValidationResult({ status: 'ERROR', message: `ACCESS DENIED: Please scan the EXIT QR pass.` });
          return;
        }
      }

      if (isCheckingIn) {
        // Verify time range (allow entry up to 1 hour early for ADVANCE bookings)
        if (matchedBooking.booking_type !== 'WALKIN' && now < start - 60 * 60 * 1000) {
          setValidationResult({
            status: 'ERROR',
            message: `ACCESS DENIED: Too early for check-in. Booking starts at ${new Date(start).toLocaleTimeString()}.`
          });
          return;
        }

        // Perform Check-in database update first to catch logical errors (e.g. car in two places)
        const { error, booking: checkedInBooking } = await dbService.checkInDriver(matchedBooking.qr_code_token, user!.id);
        
        if (error) {
          setValidationResult({
            status: 'ERROR',
            message: error
          });
          
          await dbService.addAccessLog({
            location_id: selectedLocId,
            method: method === 'MANUAL' ? 'MANUAL' : method,
            event_type: 'ENTRY',
            result: 'DENIED',
            plate_number: matchedBooking.vehicle?.registration_number,
            rfid_uid: method === 'RFID' ? lookupToken : undefined,
            reason: error
          });
          return;
        }

        // Grant Entry
        setValidationResult({
          status: 'SUCCESS',
          message: `✓ ENTRY GRANTED: Valid Booking found for ${checkedInBooking.driver?.full_name || 'Driver'} (${checkedInBooking.vehicle?.brand_model || 'Vehicle'} - ${checkedInBooking.vehicle?.registration_number}).`,
          details: checkedInBooking
        });

        // Trigger Gate Opening
        triggerGateOpen();
        
        // Log Access Entry
        await dbService.addAccessLog({
          location_id: selectedLocId,
          booking_id: checkedInBooking.id,
          method: method === 'MANUAL' ? 'MANUAL' : method,
          event_type: 'ENTRY',
          result: 'GRANTED',
          plate_number: checkedInBooking.vehicle?.registration_number,
          rfid_uid: method === 'RFID' ? lookupToken : undefined
        });

      } else if (isCheckingOut) {
        // Perform Check-out database update
        const { overstayCharge, booking } = await dbService.checkOutDriver(matchedBooking.exit_qr_token || matchedBooking.qr_code_token, user!.id);
        
        if (booking.status === 'PENDING_PAYMENT') {
            setValidationResult({
              status: 'WARNING',
              message: `⏳ WAITING FOR PAYMENT: Final bill is ₹${booking.final_amount}. Driver is paying via app...`,
              details: booking
            });
            triggerRealtimeEvent('checkout_payment_requested', { ...matchedBooking, ...booking });
            return;
          }

          // Grant Exit
          setValidationResult({
            status: 'SUCCESS',
            message: `✓ EXIT GRANTED: Checking out vehicle ${matchedBooking.vehicle?.registration_number}. ${overstayCharge ? `Charged overstay ₹${overstayCharge}.` : ''} Thank you.`,
            details: booking
          });

          triggerGateOpen();

        // Log Access Exit
        await dbService.addAccessLog({
          location_id: selectedLocId,
          booking_id: matchedBooking.id,
          method: method === 'MANUAL' ? 'MANUAL' : method,
          event_type: 'EXIT',
          result: 'GRANTED',
          plate_number: matchedBooking.vehicle?.registration_number,
          rfid_uid: method === 'RFID' ? lookupToken : undefined
        });
      } else if (matchedBooking.status === 'COMPLETED') {
        // Driver has paid the balance (or it was an advance booking), grant physical exit
        setValidationResult({
          status: 'SUCCESS',
          message: `✓ EXIT GRANTED: Payment is fully complete for ${matchedBooking.vehicle?.registration_number}. Gate opening.`,
          details: matchedBooking
        });
        triggerGateOpen();
      } else {
        setValidationResult({
          status: 'ERROR',
          message: `ACCESS DENIED: Booking is in ${matchedBooking.status} status.`
        });
      }

      loadLiveStatus();
    } catch (err: any) {
      showToast('Validation failed.', 'error');
    }
  };

  // Animated gate controller
  const triggerGateOpen = () => {
    setGateState('OPENING');
    setTimeout(() => {
      setGateState('OPEN');
      // Auto close after 5 seconds
      setTimeout(() => {
        setGateState('CLOSING');
        setTimeout(() => {
          setGateState('CLOSED');
        }, 1500);
      }, 5000);
    }, 1500);
  };

  const handleManualTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPlate) return;
    
    if (activeTab === 'QR') {
      validateAccessCredential('QR', manualPlate);
    } else {
      validateAccessCredential('MANUAL', manualPlate);
    }
    setManualPlate('');
  };

  const handleRFIDTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidInput) return;
    validateAccessCredential('RFID', rfidInput);
    setRfidInput('');
  };

  // Calculate live occupancy rates
  const totalSlotsCount = slots.length;
  const occupiedCount = slots.filter(s => s.status === 'OCCUPIED').length;
  const reservedCount = slots.filter(s => s.status === 'RESERVED').length;
  const maintenanceCount = slots.filter(s => s.status === 'MAINTENANCE').length;
  const availableCount = Math.max(0, totalSlotsCount - occupiedCount - reservedCount - maintenanceCount);
  const occupancyPct = totalSlotsCount > 0 ? Math.round(((occupiedCount + reservedCount) / totalSlotsCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
            <Activity className="text-brand-lime animate-pulse" size={24} />
            <span>Live Operations Center</span>
          </h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">
            Monitor real-time occupancy, scan passes, verify plates and control gate entry
          </p>
        </div>

        {/* Location selector */}
        <select
          value={selectedLocId}
          onChange={e => setSelectedLocId(e.target.value)}
          className="bg-brand-surface border border-brand-surface-hover rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand-lime"
        >
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
          {locations.length === 0 && (
            <option value="">No approved listings live</option>
          )}
        </select>
      </div>

      {locations.length === 0 ? (
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Cpu className="mx-auto text-brand-surface-hover" size={40} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No active operations.</h3>
          <p className="text-xs text-brand-text-muted max-w-xs mx-auto leading-relaxed">
            Operations control is only active for approved structures. List a property or wait for administrative approval to go live.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ==========================================
              LEFT COLUMN: ACCESS CONTROL SCANNERS & GATE
             ========================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* VIRTUAL GATE STATUS CONTAINER */}
            <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-lime/5 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">virtual gate controller</span>
                  <h3 className="text-sm font-bold text-white uppercase mt-0.5">Barrier Gate Simulator</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider border ${
                  gateState === 'CLOSED' ? 'bg-error/15 border-error/25 text-error' :
                  gateState === 'OPEN' ? 'bg-success/15 border-success/25 text-success' :
                  'bg-warning/15 border-warning/25 text-warning animate-pulse'
                }`}>
                  {gateState}
                </span>
              </div>

              {/* Gate barrier graphic */}
              <div className="bg-[#0A0A0B] border border-brand-surface-hover rounded-xl h-36 flex items-center justify-center relative overflow-hidden">
                {/* Visual support posts */}
                <div className="absolute left-1/4 bottom-0 w-8 h-20 bg-brand-charcoal border-t border-x border-brand-surface-hover rounded-t-md flex flex-col items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${gateState === 'OPEN' ? 'bg-success shadow-[0_0_8px_#22c55e]' : 'bg-error shadow-[0_0_8px_#ef4444]'} transition-all`}></div>
                </div>

                {/* Gate boom barrier arm */}
                <div 
                  className="absolute left-[calc(1/4+24px)] bottom-14 w-44 h-3 bg-brand-lime border border-white/20 origin-left transition-all duration-[1500ms] ease-in-out shadow-[0_0_12px_rgba(132,204,22,0.4)]"
                  style={{
                    transform: gateState === 'OPEN' || gateState === 'OPENING' ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}
                >
                  <div className="w-full h-full bg-repeating-stripes stripes-white"></div>
                </div>

                {/* Road layout markings */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-surface-hover/30"></div>
                <span className="absolute bottom-2 right-4 text-[9px] font-mono text-brand-text-muted">LANE 1 GATE CONTROLLER</span>
              </div>

              {/* Validation Result Box */}
              {validationResult.status !== 'IDLE' && (
                <div className={`mt-4 p-4 rounded-xl border flex items-start space-x-3 text-xs leading-relaxed ${
                  validationResult.status === 'SUCCESS' 
                    ? 'bg-success/5 border-success/20 text-success' 
                    : 'bg-error/5 border-error/20 text-error'
                } animate-slide-up`}>
                  {validationResult.status === 'SUCCESS' ? (
                    <CheckCircle className="shrink-0 mt-0.5" size={16} />
                  ) : (
                    <XCircle className="shrink-0 mt-0.5" size={16} />
                  )}
                  <div>
                    <p className="font-bold">{validationResult.status === 'SUCCESS' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</p>
                    <p className="opacity-90 mt-0.5">{validationResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE CAMERA ACCESS CONTROL TERMINAL */}
            <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="text-brand-lime" size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Access Control Terminal</h3>
                </div>

                {/* Tabs switcher */}
                <div className="flex space-x-1 bg-brand-charcoal p-1 rounded-lg border border-brand-surface-hover">
                  {(['ANPR', 'QR', 'RFID'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setSelectedLocId(selectedLocId);
                        setActiveTab(tab);
                      }}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                        activeTab === tab 
                          ? 'bg-brand-lime text-black' 
                          : 'text-brand-text-muted hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cam video feed or hardware simulator */}
              {activeTab !== 'RFID' ? (
                <div className="space-y-4">
                  <div className="relative bg-[#0A0A0B] border border-brand-surface-hover rounded-xl overflow-hidden aspect-video flex items-center justify-center group">
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                      playsInline
                      muted
                    ></video>
                    
                    {!cameraActive && (
                      <div className="text-center p-6 space-y-2 text-brand-text-muted">
                        <Scan size={36} className="mx-auto text-brand-surface-hover animate-pulse" />
                        <p className="text-xs">Webcam feed is currently offline.</p>
                      </div>
                    )}

                    {cameraActive && activeTab === 'QR' && (
                      <div className="absolute inset-0 border border-brand-lime/40 pointer-events-none flex items-center justify-center">
                        {/* QR targeting reticle box */}
                        <div className="w-48 h-48 border-2 border-brand-lime rounded-2xl relative shadow-[0_0_20px_rgba(132,204,22,0.15)]">
                          {/* Animated scan beam */}
                          <div className="absolute inset-x-0 h-0.5 bg-brand-lime shadow-[0_0_8px_#84cc16] animate-scan-beam"></div>
                        </div>
                      </div>
                    )}

                    {cameraActive && activeTab === 'ANPR' && (
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-brand-lime/30 pointer-events-none flex items-center justify-center">
                        {/* License plate horizontal targeting line */}
                        <div className="w-3/4 h-12 border border-brand-lime rounded relative flex items-center justify-center">
                          <span className="absolute -top-5 left-2 bg-[#0F0F10] border border-brand-surface-hover px-1 rounded text-[8px] text-brand-lime font-mono">ALIGN NUMBER PLATE</span>
                        </div>
                      </div>
                    )}

                    {/* Canvas used for frame capture (invisible but required for OCR/QR extraction) */}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                  </div>

                  {/* Camera Controls */}
                  <div className="flex flex-wrap gap-2 justify-between items-center bg-brand-charcoal/50 border border-brand-surface-hover p-3 rounded-xl">
                    <div className="flex space-x-2">
                      {!cameraActive ? (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                        >
                          <Play size={12} />
                          <span>Start Camera</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-brand-charcoal hover:bg-brand-surface-hover border border-brand-surface-hover text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                        >
                          <Square size={12} />
                          <span>Stop Camera</span>
                        </button>
                      )}
                    </div>

                    {cameraActive && activeTab === 'ANPR' && (
                      <button
                        type="button"
                        onClick={captureANPRFrame}
                        disabled={ocrProcessing}
                        className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Camera size={12} />
                        <span>{ocrProcessing ? 'Running OCR...' : 'Capture & Extract Plate'}</span>
                      </button>
                    )}
                  </div>

                  {/* PREDEFINED TEST CARDS (Section 91 & 92 instructions) */}
                  <div className="space-y-2 pt-2 border-t border-brand-surface-hover/40">
                    <span className="text-[9px] font-mono text-brand-text-muted uppercase block">Demo Test Plate templates</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => validateAccessCredential('ANPR', 'UP78AB1234')}
                        className="bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime text-brand-text-muted hover:text-white p-2 rounded-xl text-[10px] font-mono font-bold transition-all text-center flex flex-col"
                      >
                        <span>Hyundai Creta</span>
                        <span className="text-brand-lime text-xs mt-0.5">UP78AB1234</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => validateAccessCredential('ANPR', 'UP78AB9999')}
                        className="bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime text-brand-text-muted hover:text-white p-2 rounded-xl text-[10px] font-mono font-bold transition-all text-center flex flex-col"
                      >
                        <span>Invalid / Expired</span>
                        <span className="text-error text-xs mt-0.5">UP78AB9999</span>
                      </button>
                      
                      {/* Manual text input simulation */}
                      <form onSubmit={handleManualTest} className="col-span-2 sm:col-span-1 flex space-x-1">
                        <input
                          type="text"
                          placeholder="Type Plate..."
                          value={manualPlate}
                          onChange={e => setManualPlate(e.target.value)}
                          className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-2 text-[10px] font-mono flex-1 outline-none text-white"
                        />
                        <button type="submit" className="bg-brand-lime text-black font-bold text-[10px] px-2 rounded-lg"><Check size={11} /></button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                /* RFID simulator tab */
                <div className="bg-brand-charcoal/30 border border-brand-surface-hover rounded-xl p-6 space-y-4">
                  <div className="text-center space-y-2 max-w-sm mx-auto">
                    <Radio className="mx-auto text-brand-lime animate-pulse" size={28} />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">RFID Credentials Reader</h4>
                    <p className="text-[11px] text-brand-text-muted leading-relaxed">
                      Type the RFID Tag UID card identifier below to simulate card swipe. UIDs must be looked up against active database credentials.
                    </p>
                  </div>

                  <form onSubmit={handleRFIDTest} className="flex gap-2 max-w-md mx-auto pt-2">
                    <input
                      type="text"
                      placeholder="e.g. RFID-82931"
                      value={rfidInput}
                      onChange={e => setRfidInput(e.target.value)}
                      className="flex-1 bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono text-center font-bold"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 rounded-lg text-xs font-bold transition-all"
                    >
                      Swipe Card
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              RIGHT COLUMN: STATISTICS & LIVE LOGS
             ========================================== */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* LIVE OCCUPANCY SUMMARY METRICS */}
            <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4 shadow-xl">
              <div>
                <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">inventory monitor</span>
                <h3 className="text-sm font-bold text-white uppercase mt-0.5">Live Occupancy</h3>
              </div>

              {/* Progress bar gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-brand-lime">{occupancyPct}% OCCUPIED</span>
                  <span className="text-brand-text-muted">{availableCount} SPOTS OPEN</span>
                </div>
                <div className="h-2.5 bg-brand-charcoal rounded-full overflow-hidden border border-brand-surface-hover flex">
                  <div className="bg-brand-lime transition-all duration-350" style={{ width: `${Math.min(100, occupancyPct)}%` }}></div>
                </div>
              </div>

              {/* Metric stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-brand-charcoal/50 border border-brand-surface-hover p-2.5 rounded-xl">
                  <span className="text-success font-mono font-bold block text-sm">{availableCount}</span>
                  <span className="text-[8px] text-brand-text-muted uppercase font-mono block mt-0.5">Free</span>
                </div>
                <div className="bg-brand-charcoal/50 border border-brand-surface-hover p-2.5 rounded-xl">
                  <span className="text-error font-mono font-bold block text-sm">{occupiedCount}</span>
                  <span className="text-[8px] text-brand-text-muted uppercase font-mono block mt-0.5">Parked</span>
                </div>
                <div className="bg-brand-charcoal/50 border border-brand-surface-hover p-2.5 rounded-xl">
                  <span className="text-warning font-mono font-bold block text-sm">{reservedCount}</span>
                  <span className="text-[8px] text-brand-text-muted uppercase font-mono block mt-0.5">Booked</span>
                </div>
                <div className="bg-brand-charcoal/50 border border-brand-surface-hover p-2.5 rounded-xl">
                  <span className="text-brand-text-muted font-mono font-bold block text-sm">{maintenanceCount}</span>
                  <span className="text-[8px] text-brand-text-muted uppercase font-mono block mt-0.5">Lock</span>
                </div>
              </div>
            </div>

            {/* ACTIVE VEHICLES LOG TABLE */}
            <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-3 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime">Active Stays</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase font-mono">
                      <th className="py-2">Vehicle</th>
                      <th className="py-2">Slot</th>
                      <th className="py-2">Expected Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(b => b.status === 'ACTIVE').map(b => (
                      <tr key={b.id} className="border-b border-brand-surface-hover/30 text-brand-text-muted hover:text-white transition-colors">
                        <td className="py-2 font-semibold">
                          <span>{b.vehicle?.brand_model}</span>
                          <span className="block font-mono text-[9px] opacity-75">{b.vehicle?.registration_number}</span>
                        </td>
                        <td className="py-2 font-mono font-bold text-brand-lime">{b.slot?.slot_number}</td>
                        <td className="py-2 font-mono">{new Date(b.end_time).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                    {bookings.filter(b => b.status === 'ACTIVE').length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-brand-text-muted">No vehicles currently parked.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RECENT ACCESS AUDIT logs feed */}
            <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime">Recent Entry Logs</h3>
                <RefreshCcw size={12} className="text-brand-text-muted cursor-pointer" onClick={loadLiveStatus} />
              </div>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {accessLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-center bg-[#0F0F10] border border-brand-surface-hover p-2.5 rounded-xl text-[10px]">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${log.result === 'GRANTED' ? 'bg-success' : 'bg-error'}`}></span>
                        <span className="font-bold text-white font-mono">{log.plate_number || log.rfid_uid || 'PASS CODE'}</span>
                      </div>
                      <span className="text-[8px] font-mono text-brand-text-muted">{new Date(log.created_at).toLocaleTimeString()} • Method: {log.method}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[8px] border ${
                      log.result === 'GRANTED' 
                        ? 'bg-success/10 border-success/20 text-success' 
                        : 'bg-error/10 border-error/20 text-error'
                    }`}>
                      {log.result}
                    </span>
                  </div>
                ))}
                {accessLogs.length === 0 && (
                  <p className="text-center text-brand-text-muted py-4">No access logs registered.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
