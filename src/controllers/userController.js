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
    const user = await User.findOne({username});  // username으로 user 찾고
    if(!user){
        return res.status(400).render("login", 
            {pageTitle: "Login", 
            errorMessage: "An account with this username does not exists."},
        );
    }; 
    console.log(user.password);
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

export const edit = (req, res) => res.send("Edit user");
export const remove = (req, res) => res.send("Delete User");
export const logout = (req, res) => res.send("Log Out");
export const see = (req, res) => res.send("User ID");