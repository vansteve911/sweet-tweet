'use strict';
const httpUtils = new HttpUtils(),
  logger = require('../logger'),

httpUtils.doUploadFileFromUrl('http://xyzphoto.qiniudn.com/WpQQ%E6%88%AA%E5%9B%BE20140412164111.png', 'http://localhost:5000/api/upload/testUploadPic', {a: 1}, function(err, data){
  if (err) {
    logger.error(err);
  } else {
    logger.debug(data);
  }
});
