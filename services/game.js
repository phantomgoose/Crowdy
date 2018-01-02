const TICKRATE = 10;
const USERS = {};

class Swarm {
  constructor(x, y, radius, color, moveSpeed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.moveSpeed = moveSpeed;
  }
  moveTo(targetX, targetY) {
    if (this.x === targetX && this.y === targetY) {
      return;
    }
    const angle =
      Math.atan2(targetY - this.y, targetX - this.x) * 180 / Math.PI;
    this.x +=
      this.moveSpeed * TICKRATE / 1000 * Math.cos(angle * Math.PI / 180);
    this.y +=
      this.moveSpeed * TICKRATE / 1000 * Math.sin(angle * Math.PI / 180);
  }
}

class User {
  constructor(name, mouseX, mouseY) {
    this.name = name;
    this.mouseX = mouseX;
    this.mouseY = mouseY;
  }
}

const targetPosition = {
  x: 0,
  y: 0,
};

module.exports = server => {
  const io = require("socket.io").listen(server);
  const swarm = new Swarm(0, 0, 50, "#24292E", 100);

  io.sockets.on("connection", c_sock => {
    c_sock.on("new_user", res => {
      USERS[c_sock.id] = new User("Test", 0, 0);
    });
    c_sock.on("get_swarm_info", res => {
      c_sock.emit("update_swarm_info", swarm);
    });
    c_sock.on("update_mouse_position", res => {
      if (!USERS[c_sock.id]) {
        return;
      }
      USERS[c_sock.id].mouseX = res.x;
      USERS[c_sock.id].mouseY = res.y;
      calculateTarget();
    });
    c_sock.on("get_swarm_position", res => {
      c_sock.emit("update_swarm_position", {
        x: swarm.x,
        y: swarm.y,
      });
    });
    c_sock.on("get_target_position", res => {
      c_sock.emit("update_target_position", {
        x: targetPosition.x,
        y: targetPosition.y,
      });
    });
    c_sock.on("get_users", res => {
      c_sock.emit("update_users", USERS);
    });
    c_sock.on("disconnect", () => {
      delete USERS[c_sock.id];
    });
  });

  setInterval(function() {
    swarm.moveTo(targetPosition.x, targetPosition.y);
  }, TICKRATE);
};

function calculateTarget() {
  let sumX = 0;
  let sumY = 0;
  let userCount = Object.keys(USERS).length;
  for (let user in USERS) {
    sumX += USERS[user].mouseX;
    sumY += USERS[user].mouseY;
  }
  targetPosition.x = sumX / userCount;
  targetPosition.y = sumY / userCount;
}
