import os
import tkinter as tk
from tkinter import filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD

def select_files():
    global jsx_files
    files = filedialog.askopenfilenames(filetypes=[("JavaScript & JSX Files", "*.jsx;*.js")])
    if files:
        jsx_files.extend(files)
        update_file_list()

def update_file_list():
    file_list.delete(0, tk.END)
    for file in jsx_files:
        file_list.insert(tk.END, os.path.basename(file))

def export_txt():
    if not jsx_files:
        messagebox.showwarning("Advertencia", "No hay archivos seleccionados.")
        return
    
    save_path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text Files", "*.txt")])
    if not save_path:
        return
    
    try:
        with open(save_path, "w", encoding="utf-8") as output_file:
            for file in jsx_files:
                with open(file, "r", encoding="utf-8") as f:
                    output_file.write(f"\n// Contenido de: {os.path.basename(file)}\n")
                    output_file.write(f.read() + "\n\n")
        messagebox.showinfo("Éxito", "Archivos combinados y guardados correctamente.")
    except Exception as e:
        messagebox.showerror("Error", f"Ocurrió un error: {e}")

def drop_files(event):
    global jsx_files
    files = tk_root.tk.splitlist(event.data)
    jsx_files.extend(files)
    update_file_list()

# Configuración de la interfaz
tk_root = TkinterDnD.Tk()
tk_root.title("Combinar Archivos JS & JSX")
tk_root.geometry("400x300")

tk.Label(tk_root, text="Selecciona o arrastra archivos JS/JSX para combinarlos en un TXT").pack(pady=10)
btn_select = tk.Button(tk_root, text="Seleccionar archivos", command=select_files)
btn_select.pack()

file_list = tk.Listbox(tk_root, height=10, width=50)
file_list.pack(pady=5)

btn_export = tk.Button(tk_root, text="Exportar a TXT", command=export_txt)
btn_export.pack(pady=10)

tk_root.drop_target_register(DND_FILES)
tk_root.dnd_bind('<<Drop>>', drop_files)

jsx_files = []
tk_root.mainloop()
