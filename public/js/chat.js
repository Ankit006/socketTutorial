const socket =  io()
// elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocation  = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")



// templates
const messageTemplate = document.querySelector("#message-template").innerHTML // get the template inner html
const locationMessageTemplate = document.querySelector("#locationMessage-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML


// parse query string data to enter the chat room
    const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true}) 
    socket.emit("join",{username,room},(err)=>{
        if(err){
            alert(err)
            location.href = "/"
        }
    }) // send data to index for chat room



// send message from a user to others
$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault()
    //diable the form
    $messageFormButton.setAttribute("disabled","disabled") // disable send button after sending message to prevent double click
    const message = e.target.elements.message.value // get name input
    /* in socket emit the the callback function is a event acknowledgement. after accepting message server send a acknowledgement invoking callback function
     client socket recive the message using a callback function */ 
     // client (emit) -> server(recive) ->acknowledgement ->server
    socket.emit("sendMessage",message,(error)=>{
        // enable the form
        $messageFormButton.removeAttribute("disabled") // enable send button after acknowledgement
        $messageFormInput.value = "" //  clear the input form
        $messageFormInput.focus() // focus the cursor on the input field after clearing it
        if(error){
            return console.log(error)
        }
        console.log("Message devilverd")
    })
})

// auto scroll
const autoscroll=()=>{
    //new message
    const $newMessage = $messages.lastElementChild

    // height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight+newMessageMargin

    //visible height
    const visibleHeigth = $messages.offsetHeight

    //messages container height
    const containerHeight = $messages.scrollHeight;

    // how far have i scroll
    const scrollOffset =  $messages.scrollTop + visibleHeigth

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}


// recive message from server
socket.on("message",(message)=>{
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format("h:mm a")
    })// render html
    $messages.insertAdjacentHTML("beforeend",html) // insert html
    autoscroll()
})

// side room data
socket.on("roomData",({room,users})=>{
   const html = Mustache.render(sidebarTemplate,{
       room,
       users
   })
   document.querySelector("#sidebar").innerHTML =html
})


//recive location

socket.on("locationMessage",(message)=>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend",html)
    autoscroll()
})


// share location to server
$sendLocation.addEventListener("click",()=>{
    if(!navigator.geolocation) return alert("Your browser don't support location sharing")
    
    $sendLocation.setAttribute("disabled","disabled")
     
    navigator.geolocation.getCurrentPosition((postition)=>{
         socket.emit("sendLocation",{
             latitude:postition.coords.latitude,
             longitude:postition.coords.longitude
         },(message)=>{
             $sendLocation.removeAttribute("disabled")
             console.log(message)
         })
     })
})


