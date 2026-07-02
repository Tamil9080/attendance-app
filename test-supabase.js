require('dotenv').config();
const supabase = require('./supabaseClient');

async function testSupabase() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Test 1: Check configuration
  console.log('✓ Supabase URL:', process.env.SUPABASE_URL || 'Using default');
  console.log('✓ Supabase Key:', process.env.SUPABASE_KEY ? '***' + process.env.SUPABASE_KEY.slice(-10) : 'Using default');
  console.log('');

  try {
    // Test 2: Check if we can connect and query tables
    console.log('📊 Testing database connection...');
    
    // Try to query the students table
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (studentsError) {
      console.error('❌ Error querying students table:', studentsError.message);
      console.log('   Details:', studentsError);
    } else {
      console.log('✅ Successfully connected to students table');
      console.log('   Found', students.length, 'students (limited to 5)');
      if (students.length > 0) {
        console.log('   Sample student:', students[0]);
      }
    }
    console.log('');

    // Try to query the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error querying users table:', usersError.message);
      console.log('   Details:', usersError);
    } else {
      console.log('✅ Successfully connected to users table');
      console.log('   Found', users.length, 'users (limited to 5)');
    }
    console.log('');

    // Try to query the fees table
    const { data: fees, error: feesError } = await supabase
      .from('fees')
      .select('*')
      .limit(5);
    
    if (feesError) {
      console.error('❌ Error querying fees table:', feesError.message);
      console.log('   Details:', feesError);
    } else {
      console.log('✅ Successfully connected to fees table');
      console.log('   Found', fees.length, 'fees records (limited to 5)');
    }
    console.log('');

    // Summary
    const hasErrors = studentsError || usersError || feesError;
    if (!hasErrors) {
      console.log('🎉 All tests passed! Supabase is working properly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
      console.log('');
      console.log('💡 Common fixes:');
      console.log('   1. Make sure the tables exist in your Supabase database');
      console.log('   2. Run the SQL schema from supabase-schema.sql');
      console.log('   3. Check that your SUPABASE_KEY has the correct permissions');
      console.log('   4. Verify the SUPABASE_URL is correct');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('');
    console.log('💡 This might indicate:');
    console.log('   - Network connection issues');
    console.log('   - Invalid Supabase credentials');
    console.log('   - Missing @supabase/supabase-js package');
  }
}

testSupabase();
