/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
let transactions = [];
let myChart;
M.AutoInit();

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    transactions = data; // save db data on global variable
    populateTotal();
    populateTable();
    populateChart();
  });

// Function to get the current date
function displayDate() {
  let today = new Date();
  let date = ("0" + today.getDate()).slice(-2);
  let weekDay = today.getDay();
  let year = today.getFullYear();
  let month = today.getMonth();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  document.querySelector("#date").textContent = `${days[weekDay]}, ${months[month]} ${date}, ${year}`;
}


function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
  displayDate(); // Call to display the current date
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        display: false,
        fill: true,
        backgroundColor: "#ffccbc",
        data
      }]
    },
    options: {
      title: {
        display: true,
        text: "Total Over Time"
      },
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: "Total Amount"
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: "Time (Date)"
          }
        }],
      }
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let counterEl = document.querySelector(".character-counter");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    M.toast({ html: "Missing information! <br> Please enter the name and amount of the new transaction.", classes: "rounded" });
    return;
  }

  // Convert negative numbers
  if (amountEl.value < 0) {
    M.toast({ html: "Only positive values can be used. <br> Converting!", classes: "rounded" });
    amountEl.value = Math.abs(amountEl.value);
    console.log(amountEl.value);
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        M.toast({ html: "Missing information! <br> Please enter the name and amount of the new transaction.", classes: "rounded" });
      } else {
      // clear form
        nameEl.value = "";
        amountEl.value = "";
        counterEl.innerHTML="";
      }
    })
    .catch(err => {
    // fetch failed, so save in indexed db
      saveRecord(transaction);
      // clear form
      nameEl.value = "";
      amountEl.value = "";
      counterEl.innerHTML="";
    });
}

document.querySelector("#add-btn").onclick = (event) => {
  event.preventDefault(); // To stop propagation in the form
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = (event) => {
  event.preventDefault(); // To stop propagation in the form
  sendTransaction(false);
};

// *** FUTURE DEV : Undo and reset options **** //
document.querySelector("#reset").onclick = (event) => {
  // TO DO
};

document.querySelector("#undo").onclick = (event) => {
  // TO DO
};
