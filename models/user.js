/** User class for message.ly */
const bcrypt = require("bcrypt");
const db = require("../db")
const { DB_URI } = require("../config");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const Message = require("./message");
const ExpressError = require("../expressError");



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    try{
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      
      const result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
              VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
              RETURNING username, password, first_name, last_name, phone`,
              [username, hashedPassword, first_name, last_name, phone]);
      
      return ({...result.rows[0]});

    }catch(e){

        throw new ExpressError(e, 404);

    }
  }

  /** Authenticate: is this username/password valid */

  static async authenticate(username, password) {

    try{

      const result = await db.query(
      `SELECT username, password FROM users WHERE username = $1`,
      [username]);
      
      const user = result.rows[0];

      if(user){

        if(await bcrypt.compare(password, user.password)){

          await User.updateLoginTimestamp(username);
          return ({...user});

        }

      }

      return false;

    }catch(e){

      throw e;

    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try{

      await db.query(
        `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1`,
        [username]
      );

    }catch(e){

      throw new ExpressError(e, 404);

    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    try{

      const result = await db.query(
        `SELECT 
        username, first_name, last_name, phone 
        FROM users`
      );

      if(!result.rows.length){

        throw new ExpressError("There are not users", 404);

      }

      return result.rows;

    }catch(e){

      throw e;

    }
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`,
      [username]
    );
      
    let user = result.rows[0];

    if(!user){
      throw new ExpressError(`Username: ${username} does not exist`, 404);
    }

    return ({...user});
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try{

      const result = await db.query(`SELECT 
                                id,  
                                body,
                                sent_at, 
                                read_at,
                                to_username AS to_user
                                FROM messages
                                WHERE from_username = $1`,
                                [username]);

        if(!result.rows.length){

            throw new ExpressError(`There are no messages for ${username}`, 404);

        }

        const new_result = result.rows.map(async obj => {
            const to_u = await db.query(`SELECT username, first_name, last_name, phone FROM users WHERE username = $1`, [obj.to_user]);
            obj.to_user = to_u.rows[0];
            return obj;
        });

        return Promise.all(new_result);

    }catch(e){

      throw e;

    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    try{

      const result = await db.query(`SELECT 
                                      id,  
                                      body,
                                      sent_at, 
                                      read_at,
                                      from_username AS from_user
                                      FROM messages
                                      WHERE to_username = $1`,
                                      [username]);

        if(!result.rows.length){

            throw new ExpressError(`There are no messages for ${username}`, 404);

        }

        const new_result = result.rows.map(async obj => {
          const from_u = await db.query(`SELECT username, first_name, last_name, phone FROM users WHERE username = $1`, [obj.from_user]);
          obj.from_user = from_u.rows[0];
          return obj;
        });

      return Promise.all(new_result);

    }catch(e){

      throw e;

    }
  }
}


module.exports = User;