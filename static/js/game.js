const TICKRATE = 10;

class Swarm {
  constructor(x, y, radius, color, moveSpeed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.moveSpeed = moveSpeed;
  }
  moveTo(targetX, targetY) {
    if (
      Math.round(this.x) === Math.round(targetX) &&
      Math.round(this.y) === Math.round(targetY)
    ) {
      return;
    }
    const angle =
      Math.atan2(targetY - this.y, targetX - this.x) * 180 / Math.PI;
    this.x +=
      this.moveSpeed * TICKRATE / 1000 * Math.cos(angle * Math.PI / 180);
    this.y +=
      this.moveSpeed * TICKRATE / 1000 * Math.sin(angle * Math.PI / 180);
    console.log("updated location");
    console.log("we're at: " + this.x + " " + this.y);
    console.log("we want to be at: " + targetX + " " + targetY);
  }
}

$(document).ready(() => {
  let swarm = new Swarm();
  const mousePos = {
    x: 0,
    y: 0,
  };
  const targetPos = {
    x: 0,
    y: 0,
  };
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
    "game-area"
  ));
  const context = canvas.getContext("2d");
  const c_sock = io.connect();
  let USERS = {};

  c_sock.emit("new_user");
  c_sock.emit("get_swarm_info");

  c_sock.on("update_swarm_info", res => {
    swarm.x = res.x;
    swarm.y = res.y;
    swarm.radius = res.radius;
    swarm.color = res.color;
    swarm.moveSpeed = res.moveSpeed;
  });

  c_sock.on("update_swarm_position", res => {
    if (Math.abs(swarm.x - res.x) > 25 || Math.abs(swarm.y - res.y) > 25) {
      // alert("Swarm desync, correcting");
      swarm.x = res.x;
      swarm.y = res.y;
    }
  });

  c_sock.on("update_target_position", res => {
    targetPos.x = res.x;
    targetPos.y = res.y;
  });

  c_sock.on("update_users", res => {
    USERS = res;
    let html = "";
    for (let user in res) {
      html += "<li>";
      html += user;
      html += "X: " + res[user].mouseX;
      html += " Y: " + res[user].mouseY;
      html += "</li>";
    }
    html += "Moving towards: " + targetPos.x + " " + targetPos.y;
    $("#users").html(html);
  });

  const drawSwarm = swarm => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = swarm.color;
    context.beginPath();
    context.arc(swarm.x, swarm.y, swarm.radius, 0, 2 * Math.PI);
    context.fillStyle = swarm.color;
    context.fill();
    for (let user in USERS) {
      context.beginPath();
      context.arc(USERS[user].mouseX, USERS[user].mouseY, 10, 0, 2 * Math.PI);
      context.fillStyle = "blue";
      context.fill();
    }
  };

  const updateMousePos = e => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  };

  const moveToTarget = () => {
    if (swarm) {
      // swarm.moveTo(
      //   (targetPos.x * 90 + mousePos.x * 10) / 100,
      //   (targetPos.y * 90 + mousePos.y * 10) / 100
      // );
      swarm.moveTo(targetPos.x, targetPos.y);
      drawSwarm(swarm);
    }
  };

  canvas.addEventListener("mousemove", function(e) {
    updateMousePos(e);
  });

  setInterval(function() {
    moveToTarget();
  }, TICKRATE);

  setInterval(function() {
    c_sock.emit("update_mouse_position", mousePos);
    c_sock.emit("get_swarm_position");
    c_sock.emit("get_target_position");
    c_sock.emit("get_users");
  }, 500);
});
