class AsyncStorageMock {
    storage: {
        [key: string]: any;
    } = {};

    async setItem(key: string, value: string) {
        this.storage = {
            ...this.storage,
            [key]: value,
        }
    }

    async mergeItem(key: string, value: string) {
        const existingValue = await this.getItem(key);
        const existingObject = existingValue ? JSON.parse(existingValue) : {};
        const newObject = JSON.parse(value);

        const mergeObjects = (current: Record<string, any>, incoming: Record<string, any>): Record<string, any> => {
            const merged = { ...current };
            Object.entries(incoming).forEach(([incomingKey, incomingValue]) => {
                merged[incomingKey] = (
                    incomingValue
                    && typeof incomingValue === 'object'
                    && !Array.isArray(incomingValue)
                )
                    ? mergeObjects(current[incomingKey] ?? {}, incomingValue)
                    : incomingValue;
            });
            return merged;
        };

        await this.setItem(key, JSON.stringify(mergeObjects(existingObject, newObject)));
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

    async clear() {
        this.storage = {};
    }

}

const MockStorage = new AsyncStorageMock();

export default MockStorage;
