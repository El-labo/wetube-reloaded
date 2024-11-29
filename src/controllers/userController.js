import User from "../models/user";      
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
    res.render("join", {pageTitle:"Create Account"});}

    export const postJoin = async(req, res) => {
    const {name, email, username, password, password2, location} = req.body;
    const exists = await User.exists({$or: [{username}, {email}]});
    if(exists){
        return res.status(400).render("join", {
            pageTitle: "Create Account", 
            errorMessage:"This username/email is already taken."
        })
    }
    if(password !== password2){
        return res.status(400).render("join", {
            pageTitle: "Create Account",
            errorMessage:"Password confirmation does not match."
        })
    }
    try {
        await User.create({
            name,
            email,
            username,
            password,
            location,
        });
        return res.redirect("/login");    
    }catch(error){
        return res.status(400).render("join", {
            pageTitle: "Create Account", 
            errorMessage: error._message 
        })
    }
};
export const getLogin = (req, res) => {
    res.render("login", {pageTitle: "Log in",});
};

export const postLogin = async (req, res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username, socialOnly : false});  
    // username으로 user 찾음 //sociallogin true인 경우 비번 없으니 이 방식으로 로그인 시키면 안됨. 
    if(!user){
        return res.status(400).render("login", 
            {pageTitle: "Login", 
            errorMessage: "An account with this username does not exists."},
        );
    }; 
    const ok = await bcrypt.compare(password, user.password);// password 일치 여부 확인
    if (!ok) {
        return res.status(400).render("login", 
            {pageTitle: "Login", 
            errorMessage: "Wrong password"},
        );
    }; 
    req.session.loggedIn = true; //login 여부 알림
    req.session.user = user;  //session에 유저 정보 추가
    return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const config = {
        client_id: process.env.GH_CLIENT,
        allow_signup:false,
        scope:"read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
};

export const finishGithubLogin = async(req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (
        await fetch(finalUrl, {
        method:"POST",
        headers: {
            Accept: "application/json",
        },
    })
    ).json(); //final Url에 post 요청 //이후 json으로 저장
    if ("access_token" in tokenRequest){
        const {access_token} = tokenRequest;
        const apiUrl = "https://api.github.com";
        const userData = await(await fetch(`${apiUrl}/user`,{
            headers: {
                Authorization: `token ${access_token}`,
            },
        })).json(); //access API
        const emailData = await(
            await fetch(`${apiUrl}/user/emails`,{
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })).json();
        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        if(!emailObj){
            return res.redirect("/login");
        }
        let user = await User.findOne({email: emailObj.email});
        if(!user) {
            user = await User.create({
                avatarUrl: userData.avatar_url,
                name : userData.name,
                username: userData.login,
                email: emailObj.email,
                password: "", 
                socialOnly: true,
                location: userData.location,
            });
            req.session.loggedIn = true;
            req.session.user = user;
            return res.redirect("/"); 
        }//db에 등록된 이메일이 아니면 등록시키고 로그인
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/"); //등록된 id가 있으면 로그인시켜줌
        } 
    else {
        return res.redirect("/login");
    }
};

export const logout = async(req, res) => {
    req.session.user = null;
    req.session.loggedIn = false;
    req.flash("info", "You are logged out!");
    res.redirect("/");  
};
export const getEdit = (req, res) => {
    res.render("edit-profile", {pageTitle: "Edit Profile",});
};
export const postEdit = async(req, res) => {
    const {
        session: {
            user: {_id, avatarUrl},
        },
        body: {name, email, username, location},
        file,
    } = req;  // ES6 문법. id, name, username, location 변수 설정.   
    const updatedUser= await User.findByIdAndUpdate(
        _id, 
        {
            name, 
            username, 
            email, 
            location,
            avatarUrl: file ? file.path : avatarUrl, //file 안보낸 경우도 처리
        }, 
        {new:true} 
        ); //new 해줘야 update된 인스턴스를 변수로 받아옴
    req.session.user = updatedUser;
    return res.redirect("/users/edit");
};
//추가 필요 - db에 겹치는 email, username 있으면 error 뜨게 하기. 

export const getChangePassword = (req, res) => {
    if(req.session.user.socialOnly === true) {
        req.flash("error", "Can't change password.");
        return res.redirect("/");
    }
    res.render("users/change-password", {pageTitle: "Change Password"});
};

export const postChangePassword = async(req, res) => {
    const {
        session: {
            user: {_id, password},
        },
        body: {oldPassword, newPassword, newPassword1},
    } = req;
    const ok = await bcrypt.compare(oldPassword, password);
    if (!ok) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password", 
            errorMessage: "The current password is incorrect."
        });
    }
    if(newPassword !== newPassword1) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password", 
            errorMessage: "Passwords do not match."
        });
    }
    const user = await User.findById(_id);
    user.password = newPassword;
    await user.save();
    req.session.user.password = user.password;
    req.flash("info", "Password updated");
    //send notification
    res.redirect("/");
};




export const see = async(req, res) => {
    const {id} = req.params;
    const user = await User
    .findById(id)
    .populate({
        path: "videos",
        populate: {
            path: "owner",
            model: "User"}}); //double populate
    if(!user) {
        return res.status(404).render("404", {pageTitle:"User not found"});
    }
    return res.render("users/profile", {
        pageTitle: `${user.name}의 Profile`, 
        user,
    });
};