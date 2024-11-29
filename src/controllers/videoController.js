import Video from "../models/video";
import User from "../models/user";
import Comment from "../models/comment";

export const home = async(req, res) => {
    try {
    const videos = await Video.find({})
    .sort({createdAt:"desc"})
    .populate("owner");
    return res.render("home", { pageTitle: "Home", videos});
    } catch (error) {
        return res.send(`server Error ${error}`);
    }
};
export const watch = async(req, res) => {
    const {id} = req.params;
    const video = await Video.findById(id).populate("owner").populate("comments");

    if (!video){      
        return res.render("404", {pageTitle:"Video not found"});
    }
        return res.render("watch", { pageTitle: video.title, video, });
    };
export const getEdit = async(req, res) => {
    const {id} = req.params;
    const video = await Video.findById(id);
    if (!video){      
        return res.status(404).render("404", {pageTitle:"Video not found"});
    }
    if(String(video.owner) !== String(req.session.user._id)){
        return res.status(403).redirect("/");
    }
    return res.render("edit", { pageTitle: `Edit ${video.title}`, video});
    };
export const postEdit = async(req, res) => {
    const {id} = req.params;
    const {title, description, hashtags} = req.body;
    const video = await Video.exists({_id: id});
    if(!video){
        return res.status(400).render("404", {pageTitle:"Video not found"});
    }
    if(String(video.owner) !== String(req.session.user._id)){
        req.flash("error", "Not authorized");
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndUpdate(id, {
        title, description, hashtags: Video.formatHashtags(hashtags)
    })
    req.flash("success", "Changes saved.");
    return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Upload Video "}); 
}

export const postUpload = async (req, res) => {
    const {
        user: {_id},
    } = req.session;
    const {video, thumb} = req.files;
    const {title, description, hashtags} = req.body;
    try {
        const newVideo = await Video.create({
            title,
            description,
            fileUrl: video[0].path,
            thumbUrl : thumb[0].path,
            hashtags:Video.formatHashtags(hashtags),
            owner: _id,
        });
        const user = await User.findById(_id);
        user.videos.push(newVideo._id);
        user.save();
        return res.redirect("/");
    } catch(error){
        return res.status(400).render("upload", {
            pageTitle: "Upload Video", 
            errorMessage: error._message 
        })
    }
};

export const deleteVideo = async (req,res) => {
    const {id} = req.params;
    const video = await Video.findById(id);
    if(!video){
        return res.status(404).render("404", {pageTitle:"Video not found"});
    }
    if (String(video.owner) !== String(req.session.user._id))
        return res.status(403).redirect("/");
    await Video.findByIdAndDelete(id);
    return res.redirect("/");
};

export const search = async (req, res) => {
    const {keyword} = req.query;
    let videos = [];
    if (keyword) {
        videos = await Video.find({
            title: {
                $regex: new RegExp(keyword,"ig"),
        }}).populate("owner");
        return res.render("search", {pageTitle:"Search", videos});
    }
    return res.render("search", {pageTitle:"Search", videos});
};

export const registerView = async (req,res) => {
    const {id} = req.params;
    const video = await Video.findById(id);
    if(!video) {
        return res.sendStatus(404);
    }
    video.meta.views = video.meta.views +1 ; 
    await video.save();
    return res.sendStatus(200);
};

export const createComment = async(req, res) => {
    const {
        session: {user},
        body: {text},
        params: {id},
    } = req;
    const video = await Video.findById(id);

    if(!video) {
        return res.sendStatus(404);
    };
    const comment = await Comment.create({
        text, 
        owner: user._id,
        video:  id,

    });
    video.comments.push(comment._id); //video DB에 comment 정보 넣어주기
    video.save(); //이 코드에서는 user data에 comment 저장하는건 구현하지 않음. 사이트마다 다름. 
    return res.status(201).json({newCommentId: comment._id}); //방금 단 댓글 지울 수 있게, 브라우저에게 DB에 등록된 comment._id 보내줌. 
}

export const deleteComment = async (req, res) => {
    const commentId = req.body.commentId;
    const userId = req.session.user._id;
    const comment = await Comment.findById(commentId).populate("owner");
    const videoId = comment.video;
    if (String(comment.owner._id) !== userId) {
        return res.sendStatus(404);};
    const video = await Video.findById(videoId);
    if (!video) {
        return res.sendStatus(404);
    }
    console.log(video);
    video.comments.splice(video.comments.indexOf(commentId), 1);
    await video.save();
    await Comment.findByIdAndDelete(commentId);
    return res.sendStatus(200);
}