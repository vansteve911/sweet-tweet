var myInfo = new Vue({
  el: '#myInfo',
  data: {
    nickname: '昵称',
    avatar: ''
  },
  created: function() {
    var self = this;
    http('/api/user/me')
    .then((res)=>{
      if (res && res.code === 200 && res.data) {
        self.nickname = res.data.nickname;
        self.avatar = res.data.avatar;
      } else {
        console.warn('failed to get my info');
      }
    })
    .catch(alert);
  }
})

var register = new Vue({
  el: '#register',
  data: {
    account: '请输入邮箱',
    password: '请输入密码',
    password2: '请再次输入密码',
    nickname: '请输入昵称'
  },
  computed: {
    dataJson: function() {
      return JSON.stringify({
        account: this.account,
        password: this.password,
        nickname: this.nickname
      })
    }
  },
  methods: {
    register: function() {
      var self = this;
      httpPost('/api/user', this.dataJson)
        .then((res) => {
          return new Promise((resolve, reject) => {
            if (res && res.code) {
              if (res.code === 200) {
                resolve(res.data);
              } else {
                reject(res.message);
              }
            }
          })
        })
        .then((data) => {
          alert('你成功啦！' + JSON.stringify(data));
        })
        .catch((err) => {
          alert('你失败啦！' + err);
        });
    }
  }
})