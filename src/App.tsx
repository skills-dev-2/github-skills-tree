function App() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        GitHub Skills Tree
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Visualize and grow your developer skills through GitHub activity
                    </p>
                </header>

                <main className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="w-8 h-8 bg-primary rounded-full"></div>
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Ready to Build
                        </h2>
                        <p className="text-muted-foreground">
                            Your skills tree adventure starts here
                        </p>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default App