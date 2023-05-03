// Page behaviour

const signInBtn = document.getElementById("signIn");
const signUpBtn = document.getElementById("signUp");
const fistForm = document.getElementById("form1");
const secondForm = document.getElementById("form2");
const container = document.querySelector(".container");

const erc20BtnGetBalance = document.getElementById('btn_frm1');
const erc20FrmGetBalance = document.getElementById('frm1');

const erc20BtnGetCosas = document.getElementById('btn_frm2');
const erc20FrmGetCosas = document.getElementById('frm2');

const erc20BtnGetBalanceAcc = document.getElementById('btn_frm3');
const erc20FrmGetBalanceAcc = document.getElementById('frm3');

const exchangeBtnFrm10 = document.getElementById('btn_frm10');
const exchangeFrmFrm10 = document.getElementById('frm10');

const exchangeBtnFrm11 = document.getElementById('btn_frm11');
const exchangeFrmFrm11 = document.getElementById('frm11');

const exchangeBtnFrm12 = document.getElementById('btn_frm12');
const exchangeFrmFrm12 = document.getElementById('frm12');

const exchangeBtnFrm13 = document.getElementById('btn_frm13');
const exchangeFrmFrm13 = document.getElementById('frm13');

signInBtn.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});

signUpBtn.addEventListener("click", () => {
    container.classList.add("right-panel-active");
});

erc20BtnGetBalance.addEventListener("click", () => {
    erc20FrmGetBalance.classList.add("visible");
    erc20FrmGetCosas.classList.remove("visible");
    erc20FrmGetBalanceAcc.classList.remove("visible");
});

erc20BtnGetCosas.addEventListener("click", () => {
    erc20FrmGetBalance.classList.remove("visible");
    erc20FrmGetBalanceAcc.classList.remove("visible");
    erc20FrmGetCosas.classList.add("visible");
});

erc20BtnGetBalanceAcc.addEventListener("click", () => {
    erc20FrmGetBalance.classList.remove("visible");
    erc20FrmGetBalanceAcc.classList.add("visible");
    erc20FrmGetCosas.classList.remove("visible");
});

exchangeBtnFrm10.addEventListener("click", () => {
    exchangeFrmFrm10.classList.add("visible");
    exchangeFrmFrm11.classList.remove("visible");
    exchangeFrmFrm12.classList.remove("visible");
    exchangeFrmFrm13.classList.remove("visible");
});

exchangeBtnFrm11.addEventListener("click", () => {
    exchangeFrmFrm11.classList.add("visible");
    exchangeFrmFrm12.classList.remove("visible");
    exchangeFrmFrm13.classList.remove("visible");
    exchangeFrmFrm10.classList.remove("visible");
});

exchangeBtnFrm12.addEventListener("click", () => {
    exchangeFrmFrm10.classList.remove("visible");
    exchangeFrmFrm11.classList.remove("visible");
    exchangeFrmFrm12.classList.add("visible");
    exchangeFrmFrm13.classList.remove("visible");
});

exchangeBtnFrm13.addEventListener("click", () => {
    exchangeFrmFrm10.classList.remove("visible");
    exchangeFrmFrm11.classList.remove("visible");
    exchangeFrmFrm12.classList.remove("visible");
    exchangeFrmFrm13.classList.add("visible");
});

// Toast Alerts

let toastContainer;

function generateToast({
    message,
    type = 'success',
    length = '3000ms',
}) {
    if (type === 'success') {
        toastContainer.insertAdjacentHTML('beforeend', `<p class="toast" 
            style="background-color: rgb(8, 102, 0);
            color: white;
            box-shadow: 6px 6px 13px 0px rgb(0, 65, 55);
            animation-duration: ${length}">
            ${message}
        </p>`);
    } else {
        toastContainer.insertAdjacentHTML('beforeend', `<p class="toast" 
            style="background-color: rgb(167, 53, 0);
            color: white;
            box-shadow: 6px 6px 13px 0px rgb(95, 0, 0);
            animation-duration: ${length}">
            ${message}
        </p>`);
    }

    const toast = toastContainer.lastElementChild;
    toast.addEventListener('animationend', () => toast.remove())
}

(function initToast() {
    document.body.insertAdjacentHTML('afterbegin', `<div class="toast-container"></div>
  <style>
  
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  display: grid;
  justify-items: end;
  gap: 1.5rem;
}

.toast {
  font-size: 0.8rem;
  z-index: 9;
  border-radius: 2px;
  line-height: 1;
  padding: 0.5em 1em;
  background-color: white;
  animation: toastIt 3000ms cubic-bezier(0.785, 0.135, 0.15, 0.86) forwards;
}

@keyframes toastIt {
  0%,
  100% {
    transform: translateY(-150%);
    opacity: 0;
  }
  10%,
  90% {
    transform: translateY(0);
    opacity: 1;
  }
}
  </style>
  `);
    toastContainer = document.querySelector('.toast-container');
})()

// Common Functions

const ethDigits = 5;

function showErrorMessages(error) {
    generateToast({
        message: error,
        type: "error",
        length: "5000ms",
    });
};

function showResultMessages(result) {
    generateToast({
        message: result,
        type: "success",
        length: "5000ms",
    });
};

function parseEth(amount) {
    let length = amount.length;
    let txt = '';

    if (length > 18) {
        let units = amount.substr(0, length - 18);
        let decimals = amount.substr(length - 17, length);
        txt += units + ',';

        for (let i = 0; i < ethDigits; i++) {
            txt += decimals[i];
        }
    } else {
        txt = '0,';
        let dif = 18 - length;
        let count = 0;
        for (let i = 0; i < dif && i < ethDigits; i++, count++) {
            txt += '0';
        }
        for (let i = 0; ethDigits - count > 0; count++, i++) {
            txt += amount[i];
        }
    }

    return txt;
}