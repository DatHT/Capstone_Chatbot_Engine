var CareTaker = function () {
    this.mementos = {};

    this.add = function (key, memento) {
        this.mementos[key] = memento;
    }

    this.get = function (key) {
        return this.mementos[key];
    }
};

function createCareTaker() {
    return new CareTaker();
}

module.exports = createCareTaker;