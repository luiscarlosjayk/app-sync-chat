/**
 * This is the routing function used in CloudFront VIEWER_REQUEST event.
 * 
 * Reference:
 * - https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html
 */

// Defines allowed static file extensions
const staticFileAllowedExtensions = ['css', 'js', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot',];

// Defines redirect suffixes to append 'index.html' to the end of the request URI when it doesn't match a static file
const redirectToIndexSuffixes = ['', '/', '.', '?', '#', '.'];

function handler(event) {
    const request = event.request;
    const uri = request.uri;

    // If the request matches the static file regex, pass the request as-is
    const isStaticFile = staticFileAllowedExtensions.some(ext => uri.endsWith('.' + ext));
    if (isStaticFile) {
        return request;
    }

    // If the request ends with / attach index.html to it to access the homepage
    const redirectToIndex = redirectToIndexSuffixes.some(suffix => uri.endsWith(suffix));
    if (redirectToIndex) {
        request.uri += 'index.html';
        return request;
    }

    // Otherwise, return request as-is
    return request;
}