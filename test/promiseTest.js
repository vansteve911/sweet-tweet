'use strict'
// let list=[1,2,3,4,5]
// let dequeue = (list) => {
//   return new Promise((resolve, reject) => {
//       console.log('list: ', list)
//       // try {
//         console.log('dequeue: ', list.shift())
//         resolve()
//       // } catch (err) {
//       //   reject(err)
//       // }
//     })
//     .then(() => {
//       if (list.length) {
//         return dequeue(list)
//       } else {
//         console.log('finished')
//         return
//       }
//     })
// }

// // dequeue([1, 2, 3, 4, 5]).catch(console.error)

// dequeue({
//   a: 1
// }).catch(console.error)

const nameSymbol = Symbol('name')

class A {
  func(){
    return 'func';
  }
  static get [nameSymbol]() {
    if(!A[nameSymbol]){
      A[nameSymbol] = '[A]'
    }
    return A[nameSymbol];
  }
}

module.exports = A
