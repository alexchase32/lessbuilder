<?php
// Set the content type to JSON
header('Content-Type: application/json');

// Get the JSON data from the request
$json = file_get_contents('php://input');
$lessonData = json_decode($json, true);

// Validate the data
if (!$lessonData || !isset($lessonData['name']) || !isset($lessonData['date']) || !isset($lessonData['blocks'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid lesson data']);
    exit;
}

// Create the data directory if it doesn't exist
if (!is_dir('data')) {
    mkdir('data', 0755, true);
}

// Path to the lessons.json file
$filePath = 'data/lessons.json';

// Create the file if it doesn't exist
if (!file_exists($filePath)) {
    file_put_contents($filePath, '[]');
}

// Read the existing lessons
$lessonsJson = file_get_contents($filePath);
$lessons = json_decode($lessonsJson, true);

// Add or update the current lesson
$lessons[0] = $lessonData;  // For now, just store one lesson

// Save the updated lessons
$result = file_put_contents($filePath, json_encode($lessons, JSON_PRETTY_PRINT));

if ($result === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to save lesson']);
} else {
    echo json_encode(['success' => true]);
}
?>