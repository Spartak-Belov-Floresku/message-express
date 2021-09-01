const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const User = require("../models/user");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async (req, res, next) => {
    try{

        const { username, password} = req.body;
        const result = await User.authenticate(username, password);

        if(!result){
            return res.send(false);
        }

        let token = jwt.sign(result, SECRET_KEY);
        
        return res.json({token});
        
    }catch(e){

        return next(e);

    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
    try{
        const result = await User.register(req.body);

        let token = jwt.sign(result, SECRET_KEY);

        return res.json({token});

    }catch(e){

        return next(e);

    }
});


module.exports = router