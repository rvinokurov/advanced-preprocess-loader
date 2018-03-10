const loader = function (content) {
    this.cachable && this.cachable();
    console.log(this.resourcePath);
    return content;
};

export = loader;