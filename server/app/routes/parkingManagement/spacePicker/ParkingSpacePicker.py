import cv2
import pickle

# Initialize variables
drawing = False
start_point = (-1, -1)
temp_rectangle = None

# Try to load existing parking slot positions
try:
    with open('CarParkingPos', 'rb') as f:
        posList = pickle.load(f)
except:
    posList = []

# Open webcam
cap = cv2.VideoCapture(0)  # Change to 1 if using an external webcam

def mouseClick(events, x, y, flags, params):
    global drawing, start_point, temp_rectangle

    if events == cv2.EVENT_LBUTTONDOWN:  # Start drawing a rectangle
        drawing = True
        start_point = (x, y)
        temp_rectangle = None

    elif events == cv2.EVENT_MOUSEMOVE:  # Update rectangle dimensions while dragging
        if drawing:
            temp_rectangle = (start_point, (x, y))

    elif events == cv2.EVENT_LBUTTONUP:  # Finalize the rectangle
        drawing = False
        end_point = (x, y)
        if start_point != end_point:  # Avoid zero-size rectangles
            posList.append((start_point[0], start_point[1], end_point[0], end_point[1]))
            with open('CarParkingPos', 'wb') as f:
                pickle.dump(posList, f)

    elif events == cv2.EVENT_RBUTTONDOWN:  # Right-click to delete
        for i, (x1, y1, x2, y2) in enumerate(posList):
            if x1 <= x <= x2 and y1 <= y <= y2:
                posList.pop(i)
                with open('CarParkingPos', 'wb') as f:
                    pickle.dump(posList, f)
                break

while True:
    success, img = cap.read()
    if not success:
        print("Failed to capture frame. Check your webcam.")
        break

    # Draw saved rectangles
    for x1, y1, x2, y2 in posList:
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # Draw the temporary rectangle during dragging
    if temp_rectangle:
        cv2.rectangle(img, temp_rectangle[0], temp_rectangle[1], (0, 0, 255), 2)

    cv2.imshow('Live Parking Space Picker', img)
    cv2.setMouseCallback('Live Parking Space Picker', mouseClick)

    # Exit on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
