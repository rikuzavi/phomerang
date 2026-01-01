// function checkScreen() {
//       const main = document.getElementsByTagName('body')[0]
//       if (window.innerWidth <= 1100) {
//         main.style.display = "none";
//         alert('On Development')
//       } else {
//         main.style.display = "block";
//         alert('page reloaded')
//       }
// }

//     // Run on load
// checkScreen();

// // Run on resize
// window.addEventListener("resize", checkScreen);

let animspan = document.getElementsByClassName('animspan')[0]
let spanbtn = document.getElementsByClassName('spanbtn')
let mainimg = document.getElementsByClassName('mainimg')[0]

for(let i of spanbtn){
    i.addEventListener('click',()=>{
        if(i.innerHTML == 'brightness'){
            animspan.style.transform = 'translateX(0px)'
            mainimg.style.filter='brightness(200%)'
        }else if(i.innerHTML == 'sepia'){
            animspan.style.transform = 'translateX(130px)'
            mainimg.style.filter='sepia(200%)'
        }else if(i.innerHTML == 'grayscale'){
            animspan.style.transform = 'translateX(260px)'
            mainimg.style.filter='grayscale(100%)'
        }else if(i.innerHTML == 'negative'){
            animspan.style.transform = 'translateX(400px)'
            mainimg.style.filter='invert(100%)'
        }
    })
}
let filt = null
mainimg.addEventListener('mousedown',()=>{
    filt = mainimg.style.filter
    mainimg.style.filter='none'
})
mainimg.addEventListener('mouseup',()=>{
    mainimg.style.filter=filt
})


