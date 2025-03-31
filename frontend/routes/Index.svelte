<script>
  import { Link } from "svelte-routing";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { Badge } from "$lib/components/ui/badge";

  // Icons
  import Logo from "$resources/logo.svg";
  import Calculator from "lucide-svelte/icons/calculator";
  import BookOpen from "lucide-svelte/icons/book-open";
  import Share2 from "lucide-svelte/icons/share-2";
  import Target from "lucide-svelte/icons/target";
  import ArrowRight from "lucide-svelte/icons/arrow-right";
  import Check from "lucide-svelte/icons/check";
  import Users from "lucide-svelte/icons/users";
  import MessageSquare from "lucide-svelte/icons/message-square";
</script>

<main class="min-h-screen bg-gradient-to-b from-background to-muted/50">
  <!-- Hero Section -->
  <section class="container mx-auto px-4 py-16 md:py-24">
    <div class="flex flex-row gap-32 justify-center">
      <div class="space-y-6">
        <Badge variant="outline" class="px-3 py-1 text-sm font-medium mb-2"
          >Community-Driven Academic Platform</Badge
        >
        <div class="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <img
            src={Logo}
            alt="A+Plus"
            class="h-20 w-auto"
            style="filter: invert(28%) sepia(66%) saturate(359%) hue-rotate(88deg) brightness(92%) contrast(86%);"
          />
          <div class="flex flex-col">
            <h1
              class="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-primary text-center sm:text-left"
            >
              Plus
            </h1>
          </div>
        </div>
        <p class="text-xl text-muted-foreground max-w-md">
          The smart way to track your grades, calculate final scores, discuss
          with peers on specific courses, and achieve your academic goals.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 pt-4">
          <Link to="/register">
            <Button size="lg" class="w-full sm:w-auto">
              Get Started
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" class="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      <div class="hidden md:flex md:items-center md:justify-end relative">
        <div
          class="absolute -z-10 rounded-full bg-primary/10 w-[500px] h-[500px] -top-20 -right-20 blur-3xl"
        ></div>
        <div class="flex flex-col items-center space-y-6 max-w-md">
          <div
            class="rounded-xl bg-card shadow-lg border p-6 transform rotate-2 w-full"
          >
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <div>
                  <span class="text-lg font-semibold">CS 101 Final Grade</span>
                  <div
                    class="text-xs text-muted-foreground flex items-center mt-1"
                  >
                    <Share2 class="h-3 w-3 mr-1" />
                    <span>From community template</span>
                  </div>
                </div>
                <span class="text-lg font-bold text-primary">87%</span>
              </div>
              <Separator />
              <div class="space-y-3">
                <div class="grid grid-cols-3 text-sm">
                  <span>Midterm</span>
                  <span class="text-center">30%</span>
                  <span class="text-right">83%</span>
                </div>
                <div class="grid grid-cols-3 text-sm">
                  <span>Project</span>
                  <span class="text-center">25%</span>
                  <span class="text-right">92%</span>
                </div>
                <div class="grid grid-cols-3 text-sm">
                  <span>Final Exam</span>
                  <span class="text-center">45%</span>
                  <span class="text-right">86%</span>
                </div>
              </div>
            </div>
          </div>
          <div
            class="rounded-xl bg-card shadow-lg border p-6 transform -rotate-3 w-full"
          >
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold">Target Grade</span>
                <span class="text-lg font-bold text-primary">90%</span>
              </div>
              <p class="text-sm text-muted-foreground">
                Need 93% on remaining assessments to reach target
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Template Sharing Highlight Section -->
  <section
    class="container mx-auto pl-12 pr-4 py-16 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
          >
            <Share2 class="h-5 w-5" />
          </div>
          <h2 class="text-3xl font-bold tracking-tight">Share & Collaborate</h2>
        </div>
        <p class="text-lg text-muted-foreground max-w-md">
          Don't start from scratch! Use and share course templates with your
          classmates to save time and ensure you're tracking all the right
          assessments.
        </p>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5"
            >
              <Users class="h-4 w-4" />
            </div>
            <div>
              <h3 class="font-medium">Community Templates</h3>
              <p class="text-muted-foreground text-sm">
                Browse templates created by other students for your courses
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5"
            >
              <MessageSquare class="h-4 w-4" />
            </div>
            <div>
              <h3 class="font-medium">Discuss & Improve</h3>
              <p class="text-muted-foreground text-sm">
                Comment on templates, discuss helpful tips for various courses,
                and more.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card p-5 rounded-xl shadow-lg border">
        <div class="space-y-4">
          <h3 class="font-semibold text-lg">Find Community Templates</h3>
          <Separator />
          <div class="space-y-3">
            <div
              class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium">CS 101: Intro to Programming</h4>
                  <p class="text-xs text-muted-foreground">
                    Stanford University • Fall 2024
                  </p>
                </div>
                <Badge variant="secondary">120 users</Badge>
              </div>
            </div>
            <div
              class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium">MATH 241: Calculus III</h4>
                  <p class="text-xs text-muted-foreground">MIT • Spring 2024</p>
                </div>
                <Badge variant="secondary">85 users</Badge>
              </div>
            </div>
            <div
              class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium">
                    CMPT 332: Introduction to Operating Systems
                  </h4>
                  <p class="text-xs text-muted-foreground">
                    University of Saskatchewan • Fall 2024
                  </p>
                </div>
                <Badge variant="secondary">62 users</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="container mx-auto px-4 py-16">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold tracking-tight mb-3">
        Everything You Need for Academic Success
      </h2>
      <p class="text-muted-foreground max-w-xl mx-auto">
        Track, calculate, and plan your way to better grades with our
        comprehensive set of tools.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card.Root>
        <Card.Header>
          <div
            class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4"
          >
            <Calculator class="h-6 w-6" />
          </div>
          <Card.Title>Grade Calculators</Card.Title>
          <Card.Description>
            Create custom calculators for each course to track and predict your
            final grade.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Calculate current standing</span>
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Predict final outcomes</span>
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Set target grades</span>
            </li>
          </ul>
        </Card.Content>
      </Card.Root>

      <Card.Root class="border-primary/50 shadow-md">
        <Card.Header>
          <div
            class="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-4"
          >
            <Share2 class="h-6 w-6" />
          </div>
          <Card.Title>Templates & Sharing</Card.Title>
          <Card.Description>
            Share your course structures with others and use community templates
            for faster setup.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Browse course templates</span>
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm"
                >Share with specific courses/institutions</span
              >
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Comment and vote on templates</span>
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Instantly import assessment structures</span
              >
            </li>
          </ul>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <div
            class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4"
          >
            <BookOpen class="h-6 w-6" />
          </div>
          <Card.Title>Course Management</Card.Title>
          <Card.Description>
            Organize your courses, track prerequisites, and plan your academic
            journey.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Manage course dependencies</span>
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Track completed courses</span>
            </li>
            <li class="flex items-center gap-2">
              <Check class="h-4 w-4 text-primary" />
              <span class="text-sm">Accurately track credit units</span>
            </li>
          </ul>
        </Card.Content>
      </Card.Root>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="container mx-auto px-4 py-16">
    <div
      class="bg-card border rounded-xl p-8 text-center max-w-3xl mx-auto shadow-lg"
    >
      <div
        class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6"
      >
        <Target class="h-8 w-8" />
      </div>
      <h2 class="text-3xl font-bold mb-4">
        Ready to achieve your academic goals?
      </h2>
      <p class="text-muted-foreground mb-8 max-w-md mx-auto">
        Join thousands of students who use A+Plus to share templates and stay on
        top of their academic performance.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/register">
          <Button size="lg" class="w-full sm:w-auto">Create Free Account</Button
          >
        </Link>
        <Link to="/login">
          <Button variant="outline" size="lg" class="w-full sm:w-auto"
            >Sign In</Button
          >
        </Link>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="container mx-auto px-4 py-8 border-t">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} A+Plus. All rights reserved.
      </div>
    </div>
  </footer>
</main>
