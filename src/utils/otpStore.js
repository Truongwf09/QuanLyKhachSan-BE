const pendingUsers = {};

exports.savePendingUser = (email, data) => {
    pendingUsers[email] = data;
};

exports.getPendingUser = (email) => {
    return pendingUsers[email];
};

exports.removePendingUser = (email) => {
    delete pendingUsers[email];
};