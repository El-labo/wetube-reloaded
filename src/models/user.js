import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {type:String, required:true},
    email: {type:String, required:true, unique: true},
    avatarUrl: String,
    socialOnly: {type:Boolean, default:false},
    username: {type:String, required:true, unique: true },
    password: {type:String},
    location: String,
    videos : [{type: mongoose.Schema.Types.ObjectId, ref:"Video"}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref:"Comment"}]
});

userSchema.pre('save', async function(){
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 5);//비밀번호가 수정되었을 떄만 해시
}
});

const User = mongoose.model("User", userSchema);
export default User;