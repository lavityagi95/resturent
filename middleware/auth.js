function isAdmin(req,res,next){
    if(req.session.role === "admin"){
        next();
    } else {
        res.redirect("/login");
    }
}

function isUser(req,res,next){
    if(req.session.role === "user"){
        next();
    } else {
        res.redirect("/login");
    }
}

module.exports = { isAdmin, isUser };
