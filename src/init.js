import "./db";
import "./models/video";
import "./models/user";
import app from "./server"

const PORT = 5000;

const handleListening = () => 
    console.log(`Server Listening on http://localhost:${PORT}`);

app.listen(PORT, handleListening);