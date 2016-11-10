#!/bin/bash


echo "update lambda script in aws for resize for " $1
echo "-------------------------------------------"


echo "delete (if exist) " lambda-$1resize
aws cloudformation delete-stack --stack-name lambda-$1-resize-img



echo "upload code"
npm install
rm lambda-resize-code.zip
zip -r lambda-resize-code.zip index.js config.json node_modules/async node_modules/gm node_modules/array-parallel node_modules/array-series node_modules/debug node_modules/debug node_modules/gm node_modules/ms node_modules/sax node_modules/xml2js node_modules/xmlbuilder



aws s3 cp lambda-resize-code.zip s3://$1/


sleep 30s

echo "recreate stack"
aws cloudformation create-stack --stack-name lambda-$1-resize-img --template-body file://template.json  --parameters ParameterKey=BucketName,ParameterValue=$1 --capabilities CAPABILITY_IAM
