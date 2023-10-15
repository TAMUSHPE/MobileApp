class AsyncStorageMock {
    storage: {
        [key: string]: any;
    } = {};

    async setItem(key: string, value: string) {
        this.storage = {
            ...this.storage,
            key: value,
        }
    }

    async getItem(key: string) {
        const value = this.storage[key];
        return value ?? null;
    }

    async removeItem(key: string) {
        if(key in this.storage){
            delete this.storage[key];
        }
    }

}

const MockStorage = new AsyncStorageMock();

export default MockStorage;
