import java.util.*;

class Task {
    private String title;
    private String description;
    private String dueDate;
    private String priority;
    private List<String> steps;
    private List<String> comments;
    private boolean isCompleted;

    public Task(String title, String description, String dueDate, String priority) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.steps = new ArrayList<>();
        this.comments = new ArrayList<>();
        this.isCompleted = false;
    }

    public void addStep(String step) {
        steps.add(step);
    }

    public void addComment(String comment) {
        comments.add(comment);
    }

    public void markComplete() {
        isCompleted = true;
    }

    public String getPriorityLabel() {
        switch (priority.toLowerCase()) {
            case "urgent": return "\u001B[31m(Urgent)\u001B[0m";   // Red
            case "important": return "\u001B[33m(Important)\u001B[0m"; // Yellow
            default: return "\u001B[32m(Normal)\u001B[0m"; // Green
        }
    }

    @Override
    public String toString() {
        return "\n📌 " + title + " " + getPriorityLabel() +
               "\n📝 " + description +
               "\n📅 Due: " + dueDate +
               "\n🔹 Steps: " + steps +
               "\n💬 Comments: " + comments +
               "\n✅ Status: " + (isCompleted ? "✔ Completed" : "⏳ In Progress") + "\n";
    }
}

class TaskManager {
    private List<Task> tasks = new ArrayList<>();

    public void addTask(Task task) {
        tasks.add(task);
    }

    public void showTasks() {
        if (tasks.isEmpty()) {
            System.out.println("No tasks yet. Add one to get started! 😊");
        } else {
            tasks.forEach(System.out::println);
        }
    }

    public void completeTask(String title) {
        for (Task task : tasks) {
            if (task.toString().contains(title)) {
                task.markComplete();
                System.out.println("🎉 Task marked as completed!");
                return;
            }
        }
        System.out.println("❌ Task not found.");
    }
}

public class TaskManagementApp {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        TaskManager taskManager = new TaskManager();

        while (true) {
            System.out.println("\n📋 ADHD-Friendly Task Manager");
            System.out.println("1️⃣ Add a Task");
            System.out.println("2️⃣ View Tasks");
            System.out.println("3️⃣ Mark Task as Completed");
            System.out.println("4️⃣ Exit");
            System.out.print("👉 Choose an option: ");
            
            int choice = scanner.nextInt();
            scanner.nextLine(); 

            switch (choice) {
                case 1 -> {
                    System.out.print("\n🔖 Task Title: ");
                    String title = scanner.nextLine();
                    System.out.print("📝 Description: ");
                    String description = scanner.nextLine();
                    System.out.print("📅 Due Date (YYYY-MM-DD): ");
                    String dueDate = scanner.nextLine();
                    System.out.print("⚠️ Priority (Urgent/Important/Normal): ");
                    String priority = scanner.nextLine();

                    Task task = new Task(title, description, dueDate, priority);

                    System.out.println("➕ Add Steps? (yes/no)");
                    if (scanner.nextLine().equalsIgnoreCase("yes")) {
                        while (true) {
                            System.out.print("👉 Enter Step (or 'done' to finish): ");
                            String step = scanner.nextLine();
                            if (step.equalsIgnoreCase("done")) break;
                            task.addStep(step);
                        }
                    }

                    System.out.println("💬 Add Comments? (yes/no)");
                    if (scanner.nextLine().equalsIgnoreCase("yes")) {
                        while (true) {
                            System.out.print("🗨 Enter Comment (or 'done' to finish): ");
                            String comment = scanner.nextLine();
                            if (comment.equalsIgnoreCase("done")) break;
                            task.addComment(comment);
                        }
                    }

                    taskManager.addTask(task);
                    System.out.println("✅ Task Added Successfully!");
                }
                case 2 -> {
                    System.out.println("\n📌 Your Tasks:");
                    taskManager.showTasks();
                }
                case 3 -> {
                    System.out.print("\n✅ Enter Task Title to Mark as Completed: ");
                    String taskTitle = scanner.nextLine();
                    taskManager.completeTask(taskTitle);
                }
                case 4 -> {
                    System.out.println("👋 Goodbye! Stay organized! 🚀");
                    scanner.close();
                    return;
                }
                default -> System.out.println("❌ Invalid choice. Try again.");
            }
        }
    }
}



