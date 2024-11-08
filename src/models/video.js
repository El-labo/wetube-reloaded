import mongoose from "mongoose";
const videoSchema = new mongoose.Schema({
    title: {type:String, required:true, maxLength: 80 }, //정석은 title: {type {type:String, required:true, }}. 이렇게 쓰는건 short-form
    description: {type:String, required:true, minLength:10, maxLength : 140},
    createdAt: {type:Date, required:true, default: Date.now},
    hashtags: [{type:String}],
    meta: {
        views:{type:Number, default:0, required:true},
        rating: {type:Number, default:0, required:true},
    },

});

videoSchema.static('formatHashtags', function(hashtags) {
    return hashtags.split(",").map(word=> (word.startsWith("#") ? word : `#${word}`) ); 
});

const Video = mongoose.model("Video", videoSchema);

export default Video;