/* ShabazBake interactions. Product content stays in the HTML cards. */

const CART_KEY = "shabazBakeCart";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

function money(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function showToast(message) {
  let toast = document.querySelector(".toast-box");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-box";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("#cartCount, .cart-count").forEach((element) => {
    element.textContent = count;
  });
}

function readProductCard(card) {
  return {
    name: card.querySelector(".product-name").textContent.trim(),
    category: card.querySelector(".product-category").textContent.trim(),
    price: Number(card.querySelector(".product-price").textContent.replace(/[^0-9]/g, "")),
    image: card.querySelector("img").src,
  };
}

function addToCart(card) {
  const product = readProductCard(card);
  const existing = cart.find((item) => item.name === product.name);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart();
  showToast(`${product.name} added to your cart.`);
}

function calculateTotals() {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const delivery = subtotal === 0 || subtotal >= 999 ? 0 : 40;
  const discount = Number(sessionStorage.getItem("shabazBakeDiscount") || 0);
  return { subtotal, delivery, discount, total: Math.max(0, subtotal + delivery - discount) };
}

function renderCart() {
  const list = document.querySelector("#cartItems");
  if (!list) return;

  if (!cart.length) {
    list.innerHTML = `<div class="empty-cart"><i class="bi bi-cart-x"></i><h2>Your cart is empty</h2><p>Add something delicious from our menu.</p><a href="menu.html" class="btn primary"><i class="bi bi-grid"></i> Browse Menu</a></div>`;
    updateSummary();
    return;
  }

  list.innerHTML = "";
  cart.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `<img src="${item.image}" alt="${item.name}"><div class="cart-item-info"><span class="product-category">${item.category}</span><h3>${item.name}</h3><p>${money(item.price)} each</p></div><div class="quantity"><button class="minus-btn" data-index="${index}" aria-label="Decrease quantity">−</button><strong>${item.quantity}</strong><button class="plus-btn" data-index="${index}" aria-label="Increase quantity">+</button></div><div class="cart-item-total"><strong>${money(item.price * item.quantity)}</strong><button class="remove-btn" data-index="${index}" aria-label="Remove item"><i class="bi bi-trash3"></i></button></div>`;
    list.appendChild(row);
  });
  updateSummary();
}

function updateSummary() {
  const totals = calculateTotals();
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const values = { "#summaryItems": itemCount, "#subtotal": money(totals.subtotal), "#delivery": money(totals.delivery), "#discount": money(totals.discount), "#cartTotal": totals.total.toLocaleString("en-IN"), "#grandTotal": money(totals.total), "#summaryTotal": money(totals.total) };
  Object.entries(values).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  });
  const deliveryMessage = document.querySelector("#deliveryMessage");
  if (deliveryMessage) deliveryMessage.textContent = totals.subtotal >= 999 ? "Free delivery unlocked." : totals.subtotal ? `Add ${money(999 - totals.subtotal)} more for free delivery.` : "Free delivery on orders above ₹999.";
}

function filterProducts() {
  const search = document.querySelector("#searchInput, #productSearch");
  const query = search ? search.value.toLowerCase().trim() : "";
  const active = document.querySelector(".category-btn.active, .filter-btn.active")?.dataset.filter || document.querySelector(".filter-btn.active")?.dataset.category || "all";
  let visible = 0;
  document.querySelectorAll(".product-card").forEach((card) => {
    const text = card.textContent.toLowerCase();
    const category = card.querySelector(".product-category").textContent.toLowerCase().trim();
    const matches = (active === "all" || active === "All" || category === active.toLowerCase()) && text.includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  const empty = document.querySelector("#noProducts");
  if (empty) empty.hidden = visible !== 0;
}

function setupMenu() {
  const toggle = document.querySelector("#menuToggle, .menu-toggle");
  const nav = document.querySelector("#mainNav, .nav-links");
  toggle?.addEventListener("click", () => nav?.classList.toggle("show"));
  document.querySelectorAll(".category-btn, .filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".category-btn, .filter-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      filterProducts();
    });
  });
  document.querySelector("#searchInput, #productSearch")?.addEventListener("input", filterProducts);
}

function setupProductButtons() {
  document.querySelectorAll(".add-btn, .add-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      if (!card) return;
      addToCart(card);
      const original = button.innerHTML;
      button.innerHTML = '<i class="bi bi-check-lg"></i> Added';
      window.setTimeout(() => (button.innerHTML = original), 900);
    });
  });
}

function setupCart() {
  const list = document.querySelector("#cartItems");
  list?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.classList.contains("plus-btn")) cart[index].quantity += 1;
    if (button.classList.contains("minus-btn")) cart[index].quantity -= 1;
    if (button.classList.contains("remove-btn") || cart[index]?.quantity <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
  });
  document.querySelector("#clearCart")?.addEventListener("click", () => {
    cart = [];
    sessionStorage.removeItem("shahabBakeDiscount");
    saveCart();
    renderCart();
    showToast("Your cart has been cleared.");
  });
  document.querySelector("#applyCoupon")?.addEventListener("click", () => {
    const code = document.querySelector("#couponInput").value.trim().toUpperCase();
    const subtotal = calculateTotals().subtotal;
    let discount = 0;
    if (code === "WELCOME100") discount = 100;
    if (code === "CAKE10") discount = Math.round(cart.filter((item) => item.category === "Cakes").reduce((total, item) => total + item.price * item.quantity, 0) * 0.1);
    if (code === "WEEKEND") discount = 50;
    const message = document.querySelector("#couponMessage");
    if (!discount || !subtotal) {
      if (message) message.textContent = "Enter a valid coupon after adding items.";
      return;
    }
    sessionStorage.setItem("shabazBakeDiscount", discount);
    if (message) message.textContent = `Coupon applied: ${money(discount)} saved.`;
    updateSummary();
  });
}

function setupContactForm() {
  document.querySelector("#contactForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const message = document.querySelector("#formMessage, #contactSuccess");
    if (message) {
      message.textContent = "Thank you. Your message has been received.";
      message.hidden = false;
    }
    form.reset();
  });
}

function setupCheckout() {
  const form = document.querySelector("#checkoutForm");
  if (!form) return;
  updateSummary();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!cart.length) return showToast("Your cart is empty. Browse the menu first.");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const name = form.querySelector("[name='fullName']").value.trim();
    const orderNumber = `SB${new Date().toISOString().slice(0, 10).replaceAll("-", "")}${Math.floor(100 + Math.random() * 900)}`;
    const total = calculateTotals().total;
    document.querySelector("#checkoutPanel").innerHTML = `<div class="order-success"><i class="bi bi-check-circle"></i><h2>Order Placed Successfully!</h2><p>Thank you, <strong>${name}</strong>.</p><p>Order Number: <strong>${orderNumber}</strong></p><p>Total: <strong>${money(total)}</strong></p><p>Estimated delivery: 30-45 minutes</p><a class="btn primary" href="index.html">Back to Home</a></div>`;
    cart = [];
    sessionStorage.removeItem("shabazBakeDiscount");
    saveCart();
  });
}

function setupAccount() {
  const signup = document.querySelector("#signupForm");
  signup?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!signup.checkValidity()) return signup.classList.add("was-validated");
    const password = signup.querySelector("[name='password']").value;
    const confirmation = signup.querySelector("[name='confirmPassword']").value;
    const message = document.querySelector("#accountMessage");
    if (password !== confirmation) return (message.textContent = "Passwords do not match.");
    localStorage.setItem("shabazBakeAccount", JSON.stringify({ name: signup.querySelector("[name='fullName']").value, email: signup.querySelector("[name='email']").value, password }));
    message.textContent = "Account created. You can now sign in.";
    signup.reset();
  });
  document.querySelector("#signinForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const account = JSON.parse(localStorage.getItem("shabazBakeAccount") || "null");
    const email = event.currentTarget.querySelector("[name='email']").value;
    const password = event.currentTarget.querySelector("[name='password']").value;
    const message = document.querySelector("#accountMessage");
    if (!account || account.email !== email || account.password !== password) return (message.textContent = "Account details do not match this demo account.");
    localStorage.setItem("shabazBakeSignedIn", "true");
    message.textContent = `Welcome back, ${account.name}.`;
    document.querySelector("#signoutButton")?.removeAttribute("hidden");
  });
  document.querySelector("#signoutButton")?.addEventListener("click", () => {
    localStorage.removeItem("shabazBakeSignedIn");
    document.querySelector("#accountMessage").textContent = "You have been signed out.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  setupMenu();
  setupProductButtons();
  setupCart();
  setupContactForm();
  setupCheckout();
  setupAccount();
  renderCart();
  filterProducts();
});
