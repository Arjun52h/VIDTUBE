import { app } from "../app.js"; // Import your configured Express app
import connectDB from "../db/index.js"; // Import your DB connection function

// 1. Global Flag for Connection: 
// This prevents the application from trying to reconnect to the DB 
// on every subsequent request served by the same warm function instance (cold start optimization).
if (!global.isConnected) {
    global.isConnected = false;
}

const handler = async (req, res) => {
    // 2. Conditional DB Connection: Connect only if not already connected
    if (!global.isConnected) {
        console.log("Starting DB connection process for Vercel instance...");
        try {
            // connectDB handles logging and re-throwing errors if it fails
            await connectDB(); 
            global.isConnected = true;
            console.log("Vercel instance: Database connection is now active.");
        } catch (error) {
            console.error("Vercel deployment failed to connect to DB:", error.message);
            // If DB connection fails, return a 503 Service Unavailable immediately.
            return res.status(503).json({ 
                success: false, 
                message: "Service Unavailable: Critical database dependency failed.",
                details: error.message 
            });
        }
    }
    
    // 3. Hand Off to Express: Pass the request/response to your Express app
    return app(req, res);
};

export default handler;
