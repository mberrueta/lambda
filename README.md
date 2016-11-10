# AWS in Action: Lambda

Fork of https://github.com/AWSinAction/lambda

This repository demonstrates how you can create a bunch of resized images right after uploading an image to S3. The solution requires no servers, is scalable and can be automatically deployed within minutes. The following figure demonstrate the image resizing process.

![Image resizing process](./lambda_resize.png?raw=true "Image resizing process")

The solution makes use of two S3 buckets:

* The bucket that contains theoriginal images. Users upload images to this bucket. This bucket is suffixed with `original` in the following example.
* The bucket that contains the resized images. The bucket is suffixed with `-resized` in the following example.

When you upload an image to the `original` bucket a Lambda function is executed. The Lambda function downloads the image from S3, creates multiple resized versions and uploads them to the `-resized` S3 bucket. As of now three resized copies are created for every upload to `original`:

* `150x`  fixed width, height is scaled as needed
* `50x50` scale image best into box
* `x150` fixed height, width is scaled as needed

You can find out how [ImageMagick resize](http://www.imagemagick.org/Usage/resize/) works or read on to deploy the solution.

## Deploying the solution

==WARNING: This example assumes that you have installed and configured the [AWS Command Line Interface](https://aws.amazon.com/cli/)==

Also the aws user needs the following permisions
```
 "cloudformation:CreateStack","cloudformation:UpdateStack", "iam:CreateRole", "iam:DeleteRolePolicy", "iam:PutRolePolicy", "iam:DeleteRole", "iam:GetRole", "lambda:CreateFunction", "iam:PassRole", "lambda:DeleteFunction" , "lambda:GetFunctionConfiguration", "lambda:AddPermission"
```

Clone this repository ...

```
$ git clone https://git@github.com:mberrueta/lambda.git
$ cd lambda/
```

create a bucket **without bucket in the name and lowercase** e.g. `my-bucket`

```
$ aws s3 mb s3://BUCKET-NAME
```

upload the `lambda-resize-code.zip` to the bucket that you want to apply


```
$ aws s3 cp lambda-resize-code.zip s3://BUCKET-NAME/lambda-resize-code.zip
```

replace `BUCKET-NAME` in the code

```
$ aws cloudformation create-stack --stack-name lambda-resize --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=BucketName,ParameterValue=BUCKET-NAME
```

Wait until the stack is created (retry if you get `CREATE_IN_PROGRESS` this can take a few minutes).

```
$ aws cloudformation describe-stacks --stack-name lambda-resize --query Stacks[].StackStatus
[
    "CREATE_COMPLETE"
]
```

You can now upload your first image to the original` S3 bucket (you can also use the web based [Management Console](https://console.aws.amazon.com/s3) if you prefer).


You will see the resized images in the `-resized` bucket (you can also use the web based Management Console if you prefer).


As you can see, for every size configuration a new "directory" was created.


## Customize the code

```
$ npm install
$ ./bundle.sh
$ aws s3 cp lambda-resize-code.zip s3://BUCKET-NAME/lambda-resize-code.zip
```

## Summary

AWS Lambda can respond to S3 events like a new file was uploaded. The Lambda function will download theoriginal image from S3 to create new resized images. The resized images are then upload to S3 again. The Lambda solution in scalable and does not require any operational work.
