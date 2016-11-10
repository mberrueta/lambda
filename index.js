var async = require("async");
var AWS = require("aws-sdk");
var IMAGIK = require("gm").subClass({ imageMagick: true });
var s3 = new AWS.S3();
var CONFIG = require("./config.json");

function cross(left, right) {
    var res = [];
    left.forEach(function(l) {
        right.forEach(function(r) {
            res.push([l, r]);
        });
    });
    return res;
}

exports.handler = function(event, context) {
    console.log("resize: event ", JSON.stringify(event));
    async.mapLimit(event.Records, CONFIG.concurrency, function(record, cb) {

            var originalKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

            console.log("resize: file ", JSON.stringify(record.s3.object), record.s3.bucket.name);

            //  if (!originalKey.match(/\.(jpg|jpeg|png|gif)$/))
            // return false;

            //get image
            s3.getObject({
                "Bucket": record.s3.bucket.name,
                "Key": originalKey
            }, function(err, data) {
                if (err) {
                    cb(err);
                } else {

                    console.log("resize: get OK ");
                    cb(null, {
                        "originalKey": originalKey,
                        "contentType": data.ContentType,
                        // "imageType": getImageType(data.ContentType),
                        "buffer": data.Body,
                        "orig_bucket": record.s3.bucket.name
                    });
                }
            });


        },

        //put image
        function(err, images) {
            if (err) {
                context.fail(err);
            } else {

                //foreach image & size
                var resizePairs = cross(CONFIG.sizes, images);

                // console.log("resize: resizePairs ", JSON.stringify(resizePairs));

                async.eachLimit(resizePairs, CONFIG.concurrency, function(resizePair, cb) {
                    var config = resizePair[0];
                    var image = resizePair[1];
                    //image type is optional

                    console.log("resize: config ", JSON.stringify(config), image.originalKey);


                    IMAGIK(image.buffer).resize(config.size).toBuffer(function(err, buffer) {
                        if (err) {
                                console.log( 'error>>>',err)
                            cb(err);
                        } else {

		                    var fname = image.originalKey.replace(/^(.*).*(\..*)$/i, '$1-' + config.name + '$2')
		                    var dest = image.orig_bucket + '-' + CONFIG.resized_bucked_sufix;
		                    console.log("resize done: file ", fname, dest);


                            s3.putObject({
                                "Bucket": dest,
                                "Key": fname,
                                "Body": buffer
                            }, function(err) {
                                cb(err);

                                if (!err)
                                    console.log("resize: put OK ");

                            });
                        }
                    });
                }, function(err) {
                    if (err) {
                        context.fail(err);
                    } else {
                        context.succeed();
                    }
                });
            }
        });
};
