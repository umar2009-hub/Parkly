import { dbService } from '../services/dbAdapter.js';
import { UserRole } from '../types/index.js';



async function runTests() {
  console.log('===================================================');
  console.log('         PARKLY AUTOMATED INTEGRATION TESTS        ');
  console.log('===================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  try {
    // ------------------------------------------------
    // TEST 1: Auth Signup & Login
    // ------------------------------------------------
    console.log('\n--- 1. AUTHENTICATION TESTS ---');
    const signupRes = await dbService.signup(
      'Test Driver', 
      'test_driver@parkly.com', 
      '+91 99999 88888',
      'password',
      'DRIVER'
    );
    assert(signupRes.user !== null, 'Signup driver account successfully created.');
    assert(signupRes.user?.role === 'DRIVER', 'User registered with correct role (DRIVER).');

    const duplicateSignup = await dbService.signup(
      'Duplicate User',
      'test_driver@parkly.com',
      '+91 12345 67890',
      'password',
      'DRIVER'
    );
    assert(duplicateSignup.error !== null, 'Prevented registration of duplicate emails.');

    const loginRes = await dbService.login('test_driver@parkly.com', 'password');
    assert(loginRes.user !== null, 'Login successful with matching password.');

    const invalidLogin = await dbService.login('test_driver@parkly.com', 'wrong_pass');
    assert(invalidLogin.error !== null, 'Invalid login credentials rejected.');

    // ------------------------------------------------
    // TEST 2: Vehicle Management
    // ------------------------------------------------
    console.log('\n--- 2. VEHICLE MANAGEMENT ---');
    const driverId = signupRes.user!.id;
    const newVeh = await dbService.addVehicle({
      user_id: driverId,
      type: 'CAR',
      brand_model: 'Hyundai Ioniq 5',
      registration_number: 'DL-01-CA-9999',
      color: 'Matte Grey',
      is_default: true
    });
    assert(newVeh.id !== undefined, 'Vehicle added to garage database.');

    const vehicles = await dbService.getVehicles(driverId);
    assert(vehicles.length === 1, 'Correct number of vehicles fetched for driver (1).');
    assert(vehicles[0].is_default === true, 'Vehicle set as default in registry.');

    // ------------------------------------------------
    // TEST 3: Slot Booking & Pricing Calculations
    // ------------------------------------------------
    console.log('\n--- 3. PRICING & BOOKING CALCULATIONS ---');
    // Fetch a seeded slot for test (Location 1 MG Road Metro Plaza)
    const slots = await dbService.getParkingSlots('loc-1');
    const testSlot = slots.find(s => s.status === 'AVAILABLE');
    assert(testSlot !== undefined, 'Found active available slot for reservation.');

    if (testSlot) {
      const now = new Date();
      const startTime = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 min from now
      const endTime = new Date(now.getTime() + 2 * 3600 * 1000 + 10 * 60 * 1000).toISOString(); // 2 hours duration

      const booking = await dbService.createBooking(
        driverId,
        testSlot.id,
        newVeh.id,
        startTime,
        endTime,
        'UPI'
      );
      
      assert(booking.id !== undefined, 'Reservation successfully created.');
      assert(booking.total_price === testSlot.price_per_hour * 2, `Correct total pricing: ₹${booking.total_price} (Rate: ₹${testSlot.price_per_hour}/hr x 2 hrs).`);

      // ------------------------------------------------
      // TEST 4: Concurrency Overlap Check (P0 CONCURRENCY)
      // ------------------------------------------------
      console.log('\n--- 4. CONCURRENCY EXCLUSION PROTECTION ---');
      
      // Let's signup a second driver to simulate concurrent click
      const driver2 = await dbService.signup('Driver 2', 'driver2@parkly.com', '+91 11111 22222', 'password', 'DRIVER');
      
      try {
        // Try booking the EXACT SAME slot during overlapping times
        await dbService.createBooking(
          driver2.user!.id,
          testSlot.id,
          newVeh.id,
          startTime,
          endTime,
          'CREDIT_CARD'
        );
        assert(false, 'OVERLAPPING BOOKING FAILED TO TRIGGER EXCLUSION RULE (ERROR)');
      } catch (err: any) {
        assert(
          err.message.includes('reserved by another user'), 
          'Overlap prevention success! Double-booking block verified.'
        );
      }

      // ------------------------------------------------
      // TEST 5: Kiosk Check-In / Check-Out Lifecycles
      // ------------------------------------------------
      console.log('\n--- 5. CHECK-IN / CHECK-OUT LIFECYCLES ---');
      const checkinRes = await dbService.checkInDriver(booking.qr_code_token, 'owner-1');
      assert(checkinRes.error === null, 'Kiosk check-in verified successfully.');
      
      const checkinDetail = await dbService.getBookingById(booking.id);
      assert(checkinDetail?.status === 'ACTIVE', 'Reservation status updated to ACTIVE.');

      const checkoutRes = await dbService.checkOutDriver(checkinDetail!.exit_qr_token!, 'owner-1');
      assert(checkoutRes.booking.status === 'COMPLETED', 'Reservation status updated to COMPLETED.');
      
      const slotAfter = (await dbService.getParkingSlots('loc-1')).find(s => s.id === testSlot.id);
      assert(slotAfter?.status === 'AVAILABLE', 'Parking Slot returned to AVAILABLE status.');
    }

  } catch (err: any) {
    console.error('Fatal test execution failure:', err);
    failed++;
  }

  console.log('\n===================================================');
  console.log(`TESTS SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('===================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
