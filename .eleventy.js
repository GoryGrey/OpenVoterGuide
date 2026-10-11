module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/search-index.json");
  eleventyConfig.addPassthroughCopy("src/district-race-map.json");

  eleventyConfig.addFilter("candidateSlug", (value) => String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/'’]+/g, "-")
    .replace(/^-+|-+$/g, "")
  );

  // Date filter
  eleventyConfig.addFilter("readableDate", (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    pathPrefix: "/"
  };
};
