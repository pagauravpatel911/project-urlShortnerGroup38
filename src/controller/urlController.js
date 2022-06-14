const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const validUrl = require("valid-url");
const redis = require("redis");


const { promisify } = require("util");


//Connect to redis

const redisClient = redis.createClient(
  16368,     /// port number to cread
  "redis-16368.c15.us-east-1-2.ec2.cloud.redislabs.com",  // End Points
  { no_ready_check: true }
);
redisClient.auth("Y52LH5DG1XbiVCkNC2G65MvOFswvQCRQ", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");   
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const isValidBody = function (body) {
  return Object.keys(body).length > 0;
};

//***************POST/url******************//
const baseUrl = "http://localhost:3000";

const createUrl = async function (req, res) {
  try {
    const longUrl = req.body.longUrl;
    let body = req.body;
    let query = req.query;

    let cahcedLongUrl= await GET_ASYNC(`${longUrl}`)
    if(cahcedLongUrl){
      let copy = JSON.parse(cahcedLongUrl)
      console.log("from Chache")
      return res.status(200).send({status:true,data:copy})
    }

    if (!isValidBody(body)) {
      return res
        .status(400)
        .send({ status: false, msg: "Body Should not be empty" });
    }
    if (isValidBody(query)) {
      return res.status(400).send({ status: false, msg: "Invalid parameters" });
    }

    if (!isValid(longUrl)) {
      return res
        .status(400)
        .send({ status: false, msg: "longUrl should not be empty" });
    }

    if (!validUrl.isUri(baseUrl)) {
      return res
        .status(400)
        .send({ status: false, msg: "baseUrl is not valid" });
    }

    if (!validUrl.isUri(longUrl)) {
      return res
        .status(400)
        .send({ status: false, msg: "longUrl is not valid" });
    }

    const urlCode = shortid.generate().toLocaleLowerCase();
    let shortUrl = baseUrl + "/" + urlCode;

    const data = {
      longUrl,
      shortUrl,
      urlCode,
    };

    // 
    // await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
    let longUrlExist = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
   // await GET_ASYNC(`${longUrl}`, JSON.stringify(longUrlExist));

    if (longUrlExist) {
      await SET_ASYNC(`${longUrl}`, JSON.stringify(longUrlExist))
      console.log("frommongodb")
      return res.status(201).send({ status: true, msg: longUrlExist });
    }

    let savedData = await urlModel.create(data);
    let response = await urlModel
      .findOne({ _id: savedData._id })
      .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
    
    return res.status(201).send({ status: true, msg: response });
  } catch (err) {
    console.log("This is the error :", err.message);
    return res.status(500).send({ msg: "Error", error: err.message });
  }
};

module.exports.createUrl = createUrl;

//****************GET/url ********************//
// let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
// await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))

const getUrl = async function (req, res) {
  try {
    let { urlCode } = req.params;

    if (!validUrl.isValid(urlCode)) {
      res.status(400).send({ status: false, msg: "this is not a valid url" });
    }

    let check = await GET_ASYNC(`${urlCode}`);
    if (check) {
      let response = JSON.parse(check);
      console.log("from chache");
      return res.status(302).redirect(response.longUrl);
    }

    if (isValidBody(req.body))
      return res
        .status(400)
        .send({ status: false, msg: "body must not be present" });
    if (isValidBody(req.query))
      return res.status(400).send({ status: false, msg: "invalid parameters" });

    let url = await urlModel.findOne({ urlcode: urlCode });

    if (!url) {
      return res
        .status(404)
        .send({ status: false, msg: "urlcode does not exist" });
    } else {
      await SET_ASYNC(`${urlCode}`, JSON.stringify(url));
      console.log("from mongodb");

      return res.status(302).redirect(url.longUrl);
    }
  } catch (err) {
    console.log("This is error :", err.message);
    return res.status(500).send({ msg: "Error", error: err.message });
  }
};

module.exports.getUrl = getUrl;

///////////////////////////////////////////// End of urlController /////////////////////////////////////////////

//npm install express mongoose shortid valid-url
