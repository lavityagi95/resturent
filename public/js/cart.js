

document.querySelectorAll(".add-btn").forEach(button => {
    button.addEventListener("click", function(){

        const productId = this.getAttribute("data-id");
        const card = this.parentElement;
        const quantity = parseInt(card.querySelector(".count").innerText);

        if(quantity === 0){
            alert("Select quantity first");
            return;
        }

        fetch("/add-to-cart",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            })
        })
        .then(res => res.json())
        .then(data => {
            alert("Added to cart");
        });
    });
});
