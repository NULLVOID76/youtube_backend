import app from "./app.js";
import connectDB from "./db/index.js";

const port =process.env.PORT|| 8000;
connectDB()
.than(()=>{
    app.on("error",(err)=>{
        console.log(`server DB connection Error :${err}`);
        
    })
    app.listen(port,()=>{
        console.log(`Server is running at port : ${port}`);
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed !!!! ",err);
});
