'use strict';
const httpUtils = new HttpUtils();

httpUtils.doUploadFileFromUrl('http://xyzphoto.qiniudn.com/WpQQ%E6%88%AA%E5%9B%BE20140412164111.png', 'http://localhost:5000/api/upload/testUploadPic', {a: 1}, function(err, data){
  if (err) {
    console.trace();
  } else {
    console.log(data);
  }
});
