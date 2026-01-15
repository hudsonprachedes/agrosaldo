// Simple test to verify IndexedDB fix
// This would be run in the browser console to test the fix

async function testIndexedDBFix() {
  try {
    // Import the functions (this would work in the actual app context)
    const { saveMovement, getDB } = await import('./src/lib/indexeddb.ts');
    
    // Test saving a movement without ID
    const movement = await saveMovement({
      propertyId: 'test-property-123',
      type: 'birth',
      date: '2026-01-15',
      quantity: 5,
      sex: 'male',
      ageGroupId: '0-4',
      description: 'Test movement',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Movement saved successfully:', movement);
    console.log('Generated ID:', movement.id);
    
    // Verify it was stored in IndexedDB
    const db = await getDB();
    const stored = await db.get('movements', movement.id);
    console.log('✅ Movement retrieved from IndexedDB:', stored);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing IndexedDB:', error);
    return false;
  }
}

console.log('Test file created. Run testIndexedDBFix() in browser console to verify the fix.');
