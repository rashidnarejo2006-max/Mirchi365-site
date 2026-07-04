/* ==========================================================================
   receipt.js — ReceiptManager
   Pure formatting helper — builds the printable receipt HTML for a given
   order. No IndexedDB access here; script.js's checkout flow guarantees the
   order (and its customer/payment/kitchen ticket) is already saved to
   IndexedDB before this is ever called, so nothing is printed before the
   database write succeeds.
   ========================================================================== */

const ReceiptManager = {
  build(order, fmt){
    const itemsHtml = order.items.map(i=>`
      <div class="r-row"><span>${i.name} x${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>
    `).join('');
    const time = order.time instanceof Date ? order.time : new Date(order.time);
    return `
      <div class="receipt-center">
        <b style="font-size:15px;">MIRCHI 365</b><br>
        National Highway Gambat, Near New Nadra<br>
        0317-2889755 / 0312-3515342
      </div>
      <hr>
      <div class="r-row"><span>Token</span><span>#${order.token}</span></div>
      <div class="r-row"><span>Date</span><span>${time.toLocaleDateString('en-GB')}</span></div>
      <div class="r-row"><span>Time</span><span>${time.toLocaleTimeString('en-US')}</span></div>
      <div class="r-row"><span>Cashier</span><span>Admin</span></div>
      <div class="r-row"><span>Customer</span><span>${order.customer}</span></div>
      <div class="r-row"><span>Order Type</span><span>${order.type}</span></div>
      <hr>
      ${itemsHtml}
      <hr>
      <div class="r-row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
      <div class="r-row"><span>Discount</span><span>-${fmt(order.discount)}</span></div>
      <div class="r-row"><span>GST</span><span>${fmt(order.gst)}</span></div>
      <div class="r-row"><span>Service</span><span>${fmt(order.service)}</span></div>
      <div class="r-row"><span>Delivery</span><span>${fmt(order.delivery)}</span></div>
      <hr>
      <div class="r-row" style="font-size:14px;"><b>GRAND TOTAL</b><b>${fmt(order.grand)}</b></div>
      <div class="r-row"><span>Payment</span><span>${order.payment}</span></div>
      <hr>
      <div class="receipt-center">Thank you for dining with us! 🌶️<br>Visit again — Mirchi 365</div>
    `;
  },
};
