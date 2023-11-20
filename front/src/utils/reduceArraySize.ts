export function reduceArraySize(array, maxLen) {
    while (array.length > maxLen) {
        array = array.filter((_, index) => index % 2 !== 1);
    }
    return array
}
