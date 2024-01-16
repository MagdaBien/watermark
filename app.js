const Jimp = require('jimp');
const inquirer = require('inquirer');

const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
  
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('File with watermark was saved on disc');
  }
  catch(error) {
    console.log("Something went wrong... Try again."); 
    process.exit();
  }

};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;
  
    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('File with watermark was saved on disc');
  }
  catch(error) {
    console.log("Something went wrong... Try again."); 
    process.exit();
  }  
};

const prepareOutputFilename = (filename, type) => {
  const [ name, ext ] = filename.split('.');
  let operationType;
  if(type === 'watermark') { operationType ='-with-watermark';}
  else {  operationType ='-changed'; }
  return `${name}${operationType}.${ext}`;
};

const editPhoto = async function(inputFile, action, outputFile) {
  try {
    const image = await Jimp.read(inputFile);

    switch(action) {
      case 'make image brighter':
        image.brightness(.5);
        break;
      case 'increase contrast':
        image.contrast(.2);
        break;
      case 'make image b&w':
        image.color([{ apply: 'desaturate', params: [100] }]);
          break;
      case 'invert image':
        image.invert();
        break;
      default:
        image;
    }
    await image.quality(100).writeAsync(outputFile);
    console.log('Changed file was saved on disc');
  }
  catch(error) {
    console.log("Something went wrong... Try again."); 
    process.exit();
  }
}


const startApp = async () => {

  const imageFolder = './img/';

  // Ask if user is ready
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file and watermark type
  const options = await inquirer.prompt([{
  name: 'inputImage',
  type: 'input',
  message: 'What file do you want to mark?',
  default: 'test.jpg',
  }, {
  name: 'watermarkType',
  type: 'list',
  choices: ['Text watermark', 'Image watermark'],
  }]);

  // create input and output file name
  let inputFile = imageFolder + options.inputImage;
  const outputFile = imageFolder + prepareOutputFilename(options.inputImage, 'watermark'); 
  const changedFile = imageFolder + prepareOutputFilename(options.inputImage, 'change');

  // if file exist
  if (fs.existsSync(inputFile)) {

      // Ask if user wants to change sth in photo
      const answer2 = await inquirer.prompt([{
        name: 'change',
        message: 'Do you want to edit you photo?',
        type: 'confirm'
      }]);

      // edit photo before watermark
      if(answer2.change) {
        const answer3 = await inquirer.prompt([{
          name: 'correct',
          message: 'What to do?',
          type: 'list',
          choices: ['make image brighter', 'increase contrast', 'make image b&w', 'invert image'],
          }]);
          await editPhoto(inputFile, answer3.correct, changedFile);
          inputFile = changedFile;
      }

      // If TEXT WATERMARK
      if(options.watermarkType === 'Text watermark') {
        const text = await inquirer.prompt([{
          name: 'value',
          type: 'input',
          message: 'Type your watermark text:',
        }])
        options.watermarkText = text.value;
  
          await addTextWatermarkToImage(inputFile, outputFile, options.watermarkText);
          startApp();
      }
      else {
        const image = await inquirer.prompt([{
          name: 'filename',
          type: 'input',
          message: 'Type your watermark name:',
          default: 'logo.png',
        }])
        options.watermarkImage = image.filename;
  
        const watermarkFile = './img/' + image.filename;
  
          if (fs.existsSync(watermarkFile)) {
          await addImageWatermarkToImage(inputFile, outputFile, watermarkFile);
          startApp();      
          }
          else {
          console.log("Something went wrong... Try again.");
          process.exit();
          }
      }      

  }
  else {
    console.log("Something went wrong... Try again.");
    process.exit();
  }


}


startApp();