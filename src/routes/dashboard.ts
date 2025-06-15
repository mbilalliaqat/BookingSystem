import app from '../app';

app.get('/dashboard', async (c) => {
  try {
    const db = globalThis.env.DB;
    
    // Using Kysely's executeQuery for raw SQL execution
    const result = await db.executeQuery({
      sql: `
        SELECT COUNT(*) as count FROM (
          SELECT id FROM "ticket"
          UNION ALL
          SELECT id FROM "Umrah"
          UNION ALL
          SELECT id FROM "visa_processing"
          UNION ALL
          SELECT id FROM "gamca_token"
          UNION ALL
          SELECT id FROM "services"
        ) as all_bookings
      `,
      parameters: []
    });
    
    // Extract the count from the result
    const totalBookings = Number(result?.rows?.[0]?.count || 0);
    
    // Add any additional metrics you want to fetch from the database here
    // For example, to get counts by type:
    const bookingsByType = await db.executeQuery({
      sql: `
        SELECT 'Ticket' as type, COUNT(*) as count FROM "ticket"
        UNION ALL
        SELECT 'Umrah' as type, COUNT(*) as count FROM "Umrah"
        UNION ALL
        SELECT 'Visa Processing' as type, COUNT(*) as count FROM "visa_processing"
        UNION ALL
        SELECT 'GAMCA Token' as type, COUNT(*) as count FROM "gamca_token"
        UNION ALL
        SELECT 'Services' as type, COUNT(*) as count FROM "services"
      `,
      parameters: []
    });

    // Sample revenue calculation (you can customize based on your needs)
    const revenueData = await db.executeQuery({
      sql: `
      
           SELECT SUM(receivable_amount) as total FROM (
          SELECT receivable_amount FROM ticket WHERE receivable_amount IS NOT NULL
           UNION ALL
            SELECT "receivableAmount" FROM "Umrah" WHERE "receivableAmount" IS NOT NULL
             UNION ALL
            SELECT receivable_amount FROM visa_processing WHERE receivable_amount IS NOT NULL
            UNION ALL
            SELECT receivable_amount FROM gamca_token WHERE receivable_amount IS NOT NULL
            UNION ALL
            SELECT receivable_amount FROM services WHERE receivable_amount IS NOT NULL
            ) as all_revenue
      `,
      parameters: []
    });
    
    // Format the data for the dashboard
    const typeCounts = bookingsByType.rows.map(row => ({
      type: row.type,
      count: Number(row.count || 0)
    }));
    
    const totalRevenue = Number(revenueData.rows?.[0]?.total || 0);

    return c.json({
      status: 'success',
      data: {
        totalBookings,
        bookingsByType: typeCounts,
        totalRevenue,
        // Add more metrics as needed
      }
    }, 200);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return c.json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      details: error.message
    }, 500);
  }
});