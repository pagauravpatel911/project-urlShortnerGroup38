const urlModel = require("../models/urlModel")
const shortid = require('shortid')
const validUrl = require('valid-url')


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    return true
}

const isValidBody = function (body) {
    return Object.keys(body).length > 0
}

//***************POST/url******************//
const baseUrl = 'http://localhost:3000'

const createUrl = async function (req, res) {
    try {
        const longUrl = req.body.longUrl
        let body = req.body
        let query = req.query

        if (!isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Body Should not be empty" })
        }
        if (isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters" })
        }

        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, msg: "longUrl should not be empty" })
        }

        if (!validUrl.isUri(baseUrl)) {
            return res.status(400).send({ status: false, msg: "baseUrl is not valid" })
        }



        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, msg: "longUrl is not valid" })
        }

        const urlCode = shortid.generate().toLocaleLowerCase()
        let shortUrl = baseUrl + '/' + urlCode

        const data = {
            longUrl,
            shortUrl,
            urlCode
        }


        let longUrlExist = await urlModel.findOne({longUrl:longUrl}).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })


        if(longUrlExist){
            return res.status(201).send({ status: true, msg: longUrlExist})
        }


        let savedData = await urlModel.create(data)
        let response = await urlModel.findOne({ _id: savedData._id }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        return res.status(201).send({ status: true, msg: response })




    } catch (err) {
        console.log("This is the error :", err.message)
        return res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.createUrl = createUrl


//****************GET/url ********************//

const getUrl = async function (req, res) {
    try {
        let urlCode = req.params
        

        if (isValidBody(req.body)) return res.status(400).send({ status: false, msg: "body must not be present" })
        if (isValidBody(req.query)) return res.status(400).send({ status: false, msg: "invalid parameters" })
          
        let url = await urlModel.findOne(urlCode)
        
        if (!url) {
            return res.status(400).send({ status: false, msg: "urlcode does not exist" })
        }else{

       return res.status(302).redirect(url.longUrl)
        }
    } catch (err) {
        console.log("This is error :", err.message)
        return res.status(500).send({ msg: "Error", error: err.message })
    }
}


module.exports.getUrl = getUrl


////////////////////////////////////////End of urlController //////////////////////////////////////////




//npm install express mongoose shortid valid-url
