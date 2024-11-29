const videoContainer = document.getElementById('videoContainer');
const form = document.getElementById("commentForm");
let deleteComments = document.querySelectorAll("span#deleteComment");

const addComment = (text, id) => {
    const videoComments = document.querySelector(".video__comments ul");
    const newComment = document.createElement("li");
    newComment.dataset.id = id;
    newComment.className = "video__comment";
    const icon = document.createElement("i");
    icon.className = "fas fa-comment";
    const span = document.createElement("span");
    span.innerText = `${text}`;
    const span2 = document.createElement("span");
    span2.id = "deleteComment";
    span2.innerText = "❌";
    newComment.appendChild(icon);
    newComment.appendChild(span);
    newComment.appendChild(span2);
    videoComments.prepend(newComment);
};


const handleSubmit = async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const text = textarea.value;
    const videoId = videoContainer.dataset.id;
    if (text === "") {
        return;
    }
    const response =  await fetch(`/api/videos/${videoId}/comment`, {
        method: 'POST',
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({text}),
        });
        if (response.status === 201) {
            textarea.value ="";
            const {newCommentId} = await response.json();
            addComment(text, newCommentId);
            deleteComments = document.querySelectorAll("span#deleteComment");
            deleteComments.forEach((deleteComment) => deleteComment.removeEventListener("click", handleDelete));
            deleteComments.forEach((deleteComment) => deleteComment.addEventListener("click",handleDelete));
        }
    }; // 댓글이 정상적으로 post된 경우, 리얼타임 댓글 addComment
 //fetch 통해 request를 생성

//FE ; html 지우고, fetch delete, commentId
//router에서 .delete 이용
//controller에서는 user 확인하고, db에서 지우고 

const handleDelete = async (event) => {
    const li = event.srcElement.parentNode;
    const commentId = li.dataset.id;
    console.log(commentId);
    const response = await fetch(`/api/comments/${commentId}/delete`, {
        method: "DELETE",
        headers : {
            "Content-Type" : "application/json",
        }, 
        body : JSON.stringify({commentId}),
    });
    if (response.status === 200) {
        li.remove();}
};


if (form) {
form.addEventListener("submit", handleSubmit);
};

if (deleteComments) {
    deleteComments.forEach((deleteComment) => deleteComment.addEventListener("click", handleDelete));
};