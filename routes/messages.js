const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { ensureLoggedIn } = require("../middleware/auth");

const User = require("../models/user");
const Message = require("../models/message");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try{

        const { id } = req.params;
        const user = req.user.username;

        const message = await Message.get(id);
        
        if(message.from_user.username == user || message.to_user.username == user){

            return res.json(message);

        }else{

            throw new ExpressError(`No such message id: ${id}`, 404);

        }
    }catch(e){

        return next(e);
    }


});




/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {

    try{

        const { to_username, body } = req.body;
        const from_username = req.user.username;

        await User.get(to_username);

        const message = await Message.create({from_username, to_username, body})

        return res.json({message});

    }catch(e){

        return next(e);

    }

});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn,async (req, res, next) => {
    try{

        const { id } = req.params;
        const user = req.user.username;

        const message = await Message.get(id);
        
        if(message.to_user.username == user){

            const message = await Message.markRead(id);

            return res.json({message});

        }else{

            throw new ExpressError(`No such message id: ${id}`, 404);

        }

    }catch(e){

        return next(e);

    }

});

module.exports = router