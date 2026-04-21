<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

function fetchOverpass($query, $endpoints) {
    foreach ($endpoints as $url) {
        error_log("Trying: $url");

        $options = [
            "http" => [
                "method" => "POST",
                "header" => "Content-Type: text/plain\r\n",
                "content" => $query,
                "timeout" => 10
            ]
        ];

        $context = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);

        if ($response !== false) {
            error_log("Success with: $url");
            return $response;
        }

        error_log("Failed: $url");
        usleep(300000);
    }

    return false;
}

$config = json_decode(file_get_contents(__DIR__ . '/app-config.json'), true);

// read POST body
$input = json_decode(file_get_contents('php://input'), true);

$lat = floatval($input['lat']);
$lon = floatval($input['lon']);
$radius = intval($input['radius']);

// --- CACHE SETUP ---
$cacheDir = __DIR__ . '/cache/';
$cacheTime = $config['CACHE_TIME_IN_MINUTES'] * 60;

if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// use query hash as key
$key = md5($query);
$cacheFile = $cacheDir . $key . '.json';

// --- CACHE HIT ---
if (file_exists($cacheFile)) {
    if (time() - filemtime($cacheFile) < $cacheTime) {
        // optional debug header
        header('X-Cache: HIT');
        echo file_get_contents($cacheFile);
        exit;
    }
}

// --- FETCH FROM OVERPASS ---
$query = "
[out:json];
(
  node(around:$radius,$lat,$lon)[\"amenity\"=\"parking_space\"][\"parking_space\"=\"disabled\"];
  way(around:$radius,$lat,$lon)[\"amenity\"=\"parking_space\"][\"parking_space\"=\"disabled\"];
  relation(around:$radius,$lat,$lon)[\"amenity\"=\"parking_space\"][\"parking_space\"=\"disabled\"];
  node(around:$radius,$lat,$lon)[\"amenity\"=\"parking\"][\"capacity:disabled\"];
  way(around:$radius,$lat,$lon)[\"amenity\"=\"parking\"][\"capacity:disabled\"];
  relation(around:$radius,$lat,$lon)[\"amenity\"=\"parking\"][\"capacity:disabled\"];
);
out center;
";

$response = fetchOverpass($query, $config['ENDPOINTS']);

if (!$response) {
    http_response_code(500);
    echo json_encode(["error" => "All Overpass endpoints failed"]);
    exit;
}

if ($response === false) {
    echo json_encode(["error" => "Overpass request failed"]);
    exit;
}

// --- SAVE CACHE ---
file_put_contents($cacheFile, $response);

// optional debug header
header('X-Cache: MISS');

// --- RETURN ---
echo $response;
