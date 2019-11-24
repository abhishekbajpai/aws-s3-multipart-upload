const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');

const CONFIG = require('./config');
const app = express()
const port = 3000

app.use(bodyParser.json())

const BUCKET_NAME = CONFIG['globals']["AWS-BUCKET-NAME"];
const s3 = new AWS.S3({
	accessKeyId: CONFIG['globals']["ACCESS-ID"], 
	secretAccessKey: CONFIG['globals']["AWS-SECRET-KEY"], 
	signatureVersion: CONFIG['globals']["VERSION"]
});

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.get('/', (req, res, next) => {
	res.send('Hello World!')
})

app.get('/start-upload', async (req, res) => {

	try {
		let params = {
			Bucket: BUCKET_NAME,
			Key: req.query.fileName,
			ContentType: req.query.fileType
		};

		return new Promise(
			(resolve, reject) => s3.createMultipartUpload(params, (err, uploadData) => {
				if (err) {
					reject(err);
				} else {
					resolve(res.send({ uploadId: uploadData.UploadId }));
				}
			})
		);

	} catch (err) {
		console.log(err)
		return err;
	}
});

app.get('/get-upload-url', async (req, res) => {

	try {
		let params = {
			Bucket: BUCKET_NAME,
			Key: req.query.fileName,
			PartNumber: req.query.partNumber,
			UploadId: req.query.uploadId
		}

		return new Promise(
			(resolve, reject) => s3.getSignedUrl('uploadPart', params, (err, presignedUrl) => {
				if (err) {
					reject(err);
				} else {
					resolve(res.send({ presignedUrl }));
				}
			})
		);
		
	} catch (err) {
		console.log(err);
		return err;
	}

})

app.post('/complete-upload', async (req, res) => {
	try {
		console.log(req.body, ': body')
		let params = {
			Bucket: BUCKET_NAME,
			Key: req.body.params.fileName,
			MultipartUpload: {
				Parts: req.body.params.parts
			},
			UploadId: req.body.params.uploadId
		}
		console.log(params);
		return new Promise(
			(resolve, reject) => s3.completeMultipartUpload(params, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(res.send({ data }));
				}
			})
		);
	} catch (err) {
		console.log(err)
		return err;
	}
})

app.listen(port, () => {
	console.log(`app listening on port ${port}!`);
});